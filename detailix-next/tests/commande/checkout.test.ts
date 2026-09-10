import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { computePrice } from "@/lib/pricing";

// ─── Isolated, disposable SQLite database for this test file only ────────────
// NEVER points at prisma/dev.db (the real seeded data). A fresh temp file is
// created, schema-pushed, exercised, then deleted.

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const TEST_DB_PATH = path
  .join(os.tmpdir(), `detailix-checkout-test-${randomUUID()}.db`)
  .replace(/\\/g, "/");
const DATABASE_URL = `file:${TEST_DB_PATH}`;

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
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (_name: string) => undefined,
    set: () => {},
    delete: () => {},
  }),
}));

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
  await db.$disconnect();
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    try {
      fs.unlinkSync(TEST_DB_PATH + suffix);
    } catch {
      // best-effort cleanup
    }
  }
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

  it("[bug reported, not fixed] currently APPLIES the discount for an active-but-expired promo", async () => {
    // app/commande/actions.ts only checks `!promoRecord.active`; it never
    // reads `expiresAt`, even though the schema models it and the error
    // message says "invalide ou expiré". This test documents actual current
    // behavior; see final report for details — this is a real bug, not a
    // spec for correct behavior.
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

    let redirectErr: unknown;
    try {
      await createOrderAction(null, fd);
    } catch (err) {
      redirectErr = err;
    }
    expect(isRedirectError(redirectErr)).toBe(true);

    const order = await db.order.findFirstOrThrow();
    const expectedTotal = Math.round(computePrice(100) * 0.9 * 100) / 100;
    expect(order.total).toBe(expectedTotal); // discount was applied despite expiry
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
