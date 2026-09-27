import "dotenv/config";
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { computePrice } from "@/lib/pricing";

// ─── Isolated, disposable Postgres schema for this test file only ────────────
// Since the migration to Postgres (Neon), there's no local disposable SQLite
// file to spin up per run — the datasource provider is hardcoded postgresql.
// Instead, this pushes the schema into its own throwaway `schema=` on the
// SAME database (via the `schema` connection-string param Prisma supports for
// Postgres), exercises it, then drops that schema. NEVER touches the
// `public` schema (the real seeded data).
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const BASE_DATABASE_URL = process.env.DATABASE_URL;
if (!BASE_DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set — checkout.test.ts needs a real Postgres connection string (see .env.example) to push an isolated test schema into."
  );
}
const TEST_SCHEMA = `test_checkout_${randomUUID().replace(/-/g, "_")}`;
const testUrl = new URL(BASE_DATABASE_URL);
testUrl.searchParams.set("schema", TEST_SCHEMA);
const DATABASE_URL = testUrl.toString();

// ─── Mocks ────────────────────────────────────────────────────────────────────
// redirect() throws a special "NEXT_REDIRECT" error on success; we intercept it
// to assert on the intended destination without needing a real Next.js request.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    const err = new Error("NEXT_REDIRECT") as Error & { digest: string };
    err.digest = `NEXT_REDIRECT;push;${url};307;`;
    throw err;
  },
}));

// getSession() calls cookies() from next/headers; simulate an anonymous
// visitor (no session cookie) since createOrderAction accepts userId: null.
//
// headers() is used for the checkout action's rate limiting: each call
// returns a fresh, unique x-forwarded-for value so that the many
// createOrderAction() calls made across this file (well within the same
// 1-minute rate-limit window) don't trip each other's limiter bucket. The
// counter lives inside the factory (not in outer module scope) because
// vi.mock factories are hoisted above other top-level statements.
vi.mock("next/headers", () => {
  let headersCallCount = 0;
  return {
    cookies: async () => ({
      get: () => undefined,
      set: () => {},
      delete: () => {},
    }),
    headers: async () => ({
      get: (name: string) => (name === "x-forwarded-for" ? `test-ip-${headersCallCount++}` : null),
    }),
  };
});

type Db = typeof import("@/lib/db")["db"];
type CreateOrderAction = typeof import("@/app/commande/actions")["createOrderAction"];

let db: Db;
let createOrderAction: CreateOrderAction;

function isRedirectError(err: unknown): err is Error & { digest: string } {
  if (!(err instanceof Error)) return false;
  const digest = (err as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

function makeFormData(items: Array<{ productId: string; qty: number }>, promo?: string): FormData {
  const fd = new FormData();
  fd.set("items", JSON.stringify(items));
  if (promo !== undefined) fd.set("promo", promo);
  return fd;
}

beforeAll(async () => {
  // Must be set BEFORE lib/db.ts is ever imported (module-level `new
  // PrismaClient()`), hence the dynamic imports below rather than static
  // top-of-file imports.
  process.env.DATABASE_URL = DATABASE_URL;

  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: PROJECT_ROOT,
    env: { ...process.env, DATABASE_URL },
    stdio: "pipe",
  });

  ({ db } = await import("@/lib/db"));
  ({ createOrderAction } = await import("@/app/commande/actions"));

  // Sanity check: make sure we are really talking to the disposable test DB
  // and not accidentally to the real, seeded prisma/dev.db.
  const existingProducts = await db.product.count();
  expect(existingProducts).toBe(0);
}, 30000);

beforeEach(async () => {
  await db.category.create({
    data: { id: "cat-test", label: "Test Category", description: "Test" },
  });
  await db.brand.create({
    data: {
      id: "brand-test",
      categoryId: "cat-test",
      name: "Test Brand",
      origine: "FR",
      gamme: "eco",
      rating: 4,
      reviewCount: 1,
      recommended: true,
      preference: "polyvalent",
    },
  });
  await db.product.create({
    data: {
      id: "prod-test",
      brandId: "brand-test",
      categoryId: "cat-test",
      name: "Test Product",
      format: "1L",
      description: "A test product",
      prixAchat: 100,
      stockQty: 5,
      compatibilite: JSON.stringify({ type: "universel" }),
    },
  });
});

afterEach(async () => {
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.promo.deleteMany();
  await db.product.deleteMany();
  await db.brand.deleteMany();
  await db.category.deleteMany();
});

afterAll(async () => {
  await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${TEST_SCHEMA}" CASCADE`);
  await db.$disconnect();
});

describe("createOrderAction — nominal path", () => {
  it("creates an order, decrements stock by the exact quantity, and redirects to the confirmation page", async () => {
    const fd = makeFormData([{ productId: "prod-test", qty: 2 }]);

    let redirectErr: unknown;
    try {
      await createOrderAction(null, fd);
    } catch (err) {
      redirectErr = err;
    }

    expect(isRedirectError(redirectErr)).toBe(true);

    const product = await db.product.findUniqueOrThrow({ where: { id: "prod-test" } });
    expect(product.stockQty).toBe(3); // 5 - 2

    const order = await db.order.findFirstOrThrow({ include: { items: true } });
    expect(order.userId).toBeNull(); // anonymous checkout
    expect(order.status).toBe("pending");
    expect(order.total).toBe(computePrice(100) * 2);
    expect(order.items).toHaveLength(1);
    expect(order.items[0].qty).toBe(2);

    const digest = (redirectErr as Error & { digest: string }).digest;
    expect(digest).toContain(`/commande/confirmation/${order.id}`);
  });
});

describe("createOrderAction — insufficient stock", () => {
  it("fails without decrementing stock or creating an order when quantity exceeds stock", async () => {
    const fd = makeFormData([{ productId: "prod-test", qty: 10 }]); // stock is 5

    const result = await createOrderAction(null, fd);

    expect(result).toEqual({ error: expect.stringContaining("Stock insuffisant") });

    const product = await db.product.findUniqueOrThrow({ where: { id: "prod-test" } });
    expect(product.stockQty).toBe(5); // unchanged

    const orderCount = await db.order.count();
    expect(orderCount).toBe(0);
  });

  it("rolls back the ENTIRE transaction when only one of several items is out of stock", async () => {
    await db.product.create({
      data: {
        id: "prod-test-2",
        brandId: "brand-test",
        categoryId: "cat-test",
        name: "Test Product 2",
        format: "500ml",
        description: "Second test product, low stock",
        prixAchat: 20,
        stockQty: 1,
        compatibilite: JSON.stringify({ type: "universel" }),
      },
    });

    const fd = makeFormData([
      { productId: "prod-test", qty: 1 }, // sufficient on its own
      { productId: "prod-test-2", qty: 5 }, // insufficient (stock: 1)
    ]);

    const result = await createOrderAction(null, fd);
    expect(result).toEqual({ error: expect.stringContaining("Stock insuffisant") });

    const product1 = await db.product.findUniqueOrThrow({ where: { id: "prod-test" } });
    const product2 = await db.product.findUniqueOrThrow({ where: { id: "prod-test-2" } });
    // Neither product's stock should have moved: the transaction must be atomic.
    expect(product1.stockQty).toBe(5);
    expect(product2.stockQty).toBe(1);

    expect(await db.order.count()).toBe(0);
  });
});

describe("createOrderAction — promo codes", () => {
  it("applies the discount from an active promo code to the order total", async () => {
    await db.promo.create({
      data: { id: "promo-active", code: "PROMO10", discountPercent: 10, active: true },
    });

    const fd = makeFormData([{ productId: "prod-test", qty: 1 }], "PROMO10");

    let redirectErr: unknown;
    try {
      await createOrderAction(null, fd);
    } catch (err) {
      redirectErr = err;
    }
    expect(isRedirectError(redirectErr)).toBe(true);

    const order = await db.order.findFirstOrThrow();
    const expectedTotal = Math.round(computePrice(100) * 1 * 0.9 * 100) / 100;
    expect(order.total).toBe(expectedTotal);
  });

  it("rejects a promo code that does not exist, without creating an order", async () => {
    const fd = makeFormData([{ productId: "prod-test", qty: 1 }], "DOES-NOT-EXIST");

    const result = await createOrderAction(null, fd);
    expect(result).toEqual({ error: "Code promo invalide ou expiré." });
    expect(await db.order.count()).toBe(0);
  });

  it("rejects a promo code that exists but is inactive, without creating an order", async () => {
    await db.promo.create({
      data: { id: "promo-inactive", code: "OLDPROMO", discountPercent: 50, active: false },
    });

    const fd = makeFormData([{ productId: "prod-test", qty: 1 }], "OLDPROMO");

    const result = await createOrderAction(null, fd);
    expect(result).toEqual({ error: "Code promo invalide ou expiré." });
    expect(await db.order.count()).toBe(0);

    const product = await db.product.findUniqueOrThrow({ where: { id: "prod-test" } });
    expect(product.stockQty).toBe(5); // unchanged
  });

  it("rejects a promo code that is active but has expired, without creating an order", async () => {
    await db.promo.create({
      data: {
        id: "promo-expired",
        code: "EXPIRED10",
        discountPercent: 10,
        active: true,
        expiresAt: new Date("2020-01-01T00:00:00.000Z"),
      },
    });

    const fd = makeFormData([{ productId: "prod-test", qty: 1 }], "EXPIRED10");

    const result = await createOrderAction(null, fd);
    expect(result).toEqual({ error: "Code promo invalide ou expiré." });
    expect(await db.order.count()).toBe(0);

    const product = await db.product.findUniqueOrThrow({ where: { id: "prod-test" } });
    expect(product.stockQty).toBe(5); // unchanged
  });

  it("rejects a promo code that has reached its maxUses, without creating an order", async () => {
    await db.promo.create({
      data: {
        id: "promo-exhausted",
        code: "EXHAUSTED10",
        discountPercent: 10,
        active: true,
        maxUses: 3,
        usedCount: 3,
      },
    });

    const fd = makeFormData([{ productId: "prod-test", qty: 1 }], "EXHAUSTED10");

    const result = await createOrderAction(null, fd);
    expect(result).toEqual({ error: "Code promo invalide ou expiré." });
    expect(await db.order.count()).toBe(0);
  });

  it("increments usedCount by exactly 1 on a successful order", async () => {
    await db.promo.create({
      data: { id: "promo-usage", code: "USAGE10", discountPercent: 10, active: true, maxUses: 5, usedCount: 2 },
    });

    const fd = makeFormData([{ productId: "prod-test", qty: 1 }], "USAGE10");

    let redirectErr: unknown;
    try {
      await createOrderAction(null, fd);
    } catch (err) {
      redirectErr = err;
    }
    expect(isRedirectError(redirectErr)).toBe(true);

    const promo = await db.promo.findUniqueOrThrow({ where: { id: "promo-usage" } });
    expect(promo.usedCount).toBe(3);
  });

  it("does not increment usedCount when the order fails after promo validation (insufficient stock)", async () => {
    await db.promo.create({
      data: { id: "promo-rollback", code: "ROLLBACK10", discountPercent: 10, active: true, maxUses: 5, usedCount: 0 },
    });

    const fd = makeFormData([{ productId: "prod-test", qty: 10 }], "ROLLBACK10"); // stock is 5

    const result = await createOrderAction(null, fd);
    expect(result).toEqual({ error: expect.stringContaining("Stock insuffisant") });

    const promo = await db.promo.findUniqueOrThrow({ where: { id: "promo-rollback" } });
    expect(promo.usedCount).toBe(0);
  });
});

describe("createOrderAction — duplicate cart lines", () => {
  it("aggregates duplicate lines for the same product before checking stock, rejecting when the total exceeds stock", async () => {
    // stock is 5; two lines of 3 each pass an independent per-line check but
    // must fail once aggregated (3 + 3 = 6 > 5).
    const fd = makeFormData([
      { productId: "prod-test", qty: 3 },
      { productId: "prod-test", qty: 3 },
    ]);

    const result = await createOrderAction(null, fd);
    expect(result).toEqual({ error: expect.stringContaining("Stock insuffisant") });

    const product = await db.product.findUniqueOrThrow({ where: { id: "prod-test" } });
    expect(product.stockQty).toBe(5); // unchanged, never went negative

    expect(await db.order.count()).toBe(0);
  });

  it("decrements stock by the aggregated total exactly once when duplicate lines fit within stock", async () => {
    const fd = makeFormData([
      { productId: "prod-test", qty: 2 },
      { productId: "prod-test", qty: 3 },
    ]);

    let redirectErr: unknown;
    try {
      await createOrderAction(null, fd);
    } catch (err) {
      redirectErr = err;
    }
    expect(isRedirectError(redirectErr)).toBe(true);

    const product = await db.product.findUniqueOrThrow({ where: { id: "prod-test" } });
    expect(product.stockQty).toBe(0); // 5 - (2 + 3), decremented exactly once

    const order = await db.order.findFirstOrThrow({ include: { items: true } });
    expect(order.items).toHaveLength(2); // one OrderItem row per submitted line
  });
});

describe("createOrderAction — malformed input", () => {
  it("rejects an empty cart without creating an order", async () => {
    const fd = makeFormData([]);
    const result = await createOrderAction(null, fd);
    expect(result).toEqual({ error: "Données invalides." });
    expect(await db.order.count()).toBe(0);
  });

  it("rejects a cart field that isn't valid JSON", async () => {
    const fd = new FormData();
    fd.set("items", "{not valid json");
    const result = await createOrderAction(null, fd);
    expect(result).toEqual({ error: "Panier invalide." });
    expect(await db.order.count()).toBe(0);
  });

  it("rejects a cart referencing a nonexistent product", async () => {
    const fd = makeFormData([{ productId: "does-not-exist", qty: 1 }]);
    const result = await createOrderAction(null, fd);
    expect(result).toEqual({ error: expect.stringContaining("Produit introuvable") });
    expect(await db.order.count()).toBe(0);
  });
});
