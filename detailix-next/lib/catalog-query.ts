import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { computePrixAchatFromPrice } from "@/lib/pricing";

export const PAGE_SIZE = 24;

export type SortOption = "prix-asc" | "prix-desc" | "nom";
export type StockFilter = "disponible" | "tous";

/** Raw shape of Next's `searchParams` (string, repeated values as array, or absent). */
export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface CatalogExtra {
  categoryId?: string;
  brandId?: string;
  /** codeMoteur of the garage's active vehicle, if any (read server-side from the cookie). */
  vehicleCodeMoteur?: string | null;
}

export interface CatalogQuery {
  where: Prisma.ProductWhereInput;
  orderBy: Prisma.ProductOrderByWithRelationInput[];
  skip: number;
  take: number;
  page: number;
  pageSize: number;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const sortOptions: SortOption[] = ["prix-asc", "prix-desc", "nom"];

const querySchema = z.object({
  page: z.preprocess((v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
  }, z.number().int().min(1)),
  sort: z.preprocess(
    (v) => (typeof v === "string" && sortOptions.includes(v as SortOption) ? v : "nom"),
    z.enum(["prix-asc", "prix-desc", "nom"])
  ),
  prixMin: z.preprocess((v) => {
    if (v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  }, z.number().min(0).optional()),
  prixMax: z.preprocess((v) => {
    if (v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  }, z.number().min(0).optional()),
  stock: z.preprocess(
    (v) => (v === "disponible" ? "disponible" : "tous"),
    z.enum(["disponible", "tous"])
  ),
  compatible: z.preprocess((v) => v === "true" || v === "1", z.boolean()),
});

/**
 * Parses/validates catalog searchParams (page/sort/prix/stock/compatible) and builds the
 * Prisma where/orderBy/skip/take needed by both the category and brand pages, so the two
 * pages share one source of truth instead of duplicating query-building logic.
 */
export function buildCatalogQuery(searchParams: RawSearchParams, extra: CatalogExtra = {}): CatalogQuery {
  const parsed = querySchema.parse({
    page: first(searchParams.page),
    sort: first(searchParams.sort),
    prixMin: first(searchParams.prixMin),
    prixMax: first(searchParams.prixMax),
    stock: first(searchParams.stock),
    compatible: first(searchParams.compatible),
  });

  let prixMin = parsed.prixMin;
  let prixMax = parsed.prixMax;
  if (prixMin !== undefined && prixMax !== undefined && prixMin > prixMax) {
    [prixMin, prixMax] = [prixMax, prixMin];
  }

  const where: Prisma.ProductWhereInput = {
    ...(extra.categoryId ? { categoryId: extra.categoryId } : {}),
    ...(extra.brandId ? { brandId: extra.brandId } : {}),
    ...(parsed.stock === "disponible" ? { stockQty: { gt: 0 } } : {}),
  };

  if (prixMin !== undefined || prixMax !== undefined) {
    // prixMin/prixMax arrive from the UI expressed in the displayed sale price, but the
    // column stores prixAchat (buy price). Convert to prixAchat bounds before filtering,
    // otherwise the filter would be off by the configured margin.
    where.prixAchat = {
      ...(prixMin !== undefined ? { gte: computePrixAchatFromPrice(prixMin) } : {}),
      ...(prixMax !== undefined ? { lte: computePrixAchatFromPrice(prixMax) } : {}),
    };
  }

  if (parsed.compatible && extra.vehicleCodeMoteur) {
    // `compatibilite` is a JSON string (no native JSON querying in SQLite via Prisma here).
    // Rather than loading every candidate row into memory to filter in JS — which would
    // desync `count()`/pagination from the actual filtered result set — we match on the
    // quoted JSON substrings directly in the `where` clause. Matching the quoted form
    // (`"universel"` / `"<codeMoteur>"`) rather than a bare substring avoids false
    // positives such as a stored code "N47D20" matching a query for "N47".
    where.OR = [
      { compatibilite: { contains: '"universel"' } },
      { compatibilite: { contains: `"${extra.vehicleCodeMoteur}"` } },
    ];
  }

  // `id` is appended as a tiebreaker on every sort so that pagination stays stable when
  // many products share the same price/name — without it, rows can shift between pages.
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    parsed.sort === "prix-asc"
      ? [{ prixAchat: "asc" }, { id: "asc" }]
      : parsed.sort === "prix-desc"
        ? [{ prixAchat: "desc" }, { id: "asc" }]
        : // TODO: ajouter tri "note" une fois ProductReview disponible
          [{ name: "asc" }, { id: "asc" }];

  return {
    where,
    orderBy,
    skip: (parsed.page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    page: parsed.page,
    pageSize: PAGE_SIZE,
  };
}

export function computeTotalPages(total: number, pageSize: number = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
