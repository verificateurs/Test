import { describe, it, expect } from "vitest";
import { buildCatalogQuery, computeTotalPages, PAGE_SIZE } from "@/lib/catalog-query";

describe("buildCatalogQuery (defaults)", () => {
  it("defaults to page 1, sort by name, page size 24, no filters", () => {
    const q = buildCatalogQuery({});
    expect(q.page).toBe(1);
    expect(q.pageSize).toBe(PAGE_SIZE);
    expect(q.skip).toBe(0);
    expect(q.take).toBe(PAGE_SIZE);
    expect(q.orderBy).toEqual([{ name: "asc" }, { id: "asc" }]);
    expect(q.where).toEqual({});
  });

  it("scopes to a category via extra.categoryId", () => {
    const q = buildCatalogQuery({}, { categoryId: "jantes-pneus" });
    expect(q.where).toEqual({ categoryId: "jantes-pneus" });
  });

  it("scopes to a brand via extra.brandId", () => {
    const q = buildCatalogQuery({}, { brandId: "michelin" });
    expect(q.where).toEqual({ brandId: "michelin" });
  });
});

describe("buildCatalogQuery (page)", () => {
  it("computes skip from a valid page number", () => {
    const q = buildCatalogQuery({ page: "3" });
    expect(q.page).toBe(3);
    expect(q.skip).toBe(2 * PAGE_SIZE);
  });

  it("falls back to page 1 for non-numeric input", () => {
    expect(buildCatalogQuery({ page: "abc" }).page).toBe(1);
  });

  it("falls back to page 1 for a zero or negative page", () => {
    expect(buildCatalogQuery({ page: "0" }).page).toBe(1);
    expect(buildCatalogQuery({ page: "-5" }).page).toBe(1);
  });

  it("floors a fractional page value", () => {
    expect(buildCatalogQuery({ page: "2.9" }).page).toBe(2);
  });
});

describe("buildCatalogQuery (sort)", () => {
  it("orders by prixAchat asc with an id tiebreaker for prix-asc", () => {
    const q = buildCatalogQuery({ sort: "prix-asc" });
    expect(q.orderBy).toEqual([{ prixAchat: "asc" }, { id: "asc" }]);
  });

  it("orders by prixAchat desc with an id tiebreaker for prix-desc", () => {
    const q = buildCatalogQuery({ sort: "prix-desc" });
    expect(q.orderBy).toEqual([{ prixAchat: "desc" }, { id: "asc" }]);
  });

  it("falls back to sorting by name for an unrecognized sort value", () => {
    const q = buildCatalogQuery({ sort: "note" });
    expect(q.orderBy).toEqual([{ name: "asc" }, { id: "asc" }]);
  });
});

describe("buildCatalogQuery (prix)", () => {
  // real config: marginPercent = 45, so a displayed price of 145 maps to prixAchat 100.
  it("converts prixMin from displayed price to a prixAchat lower bound", () => {
    const q = buildCatalogQuery({ prixMin: "145" });
    expect(q.where.prixAchat).toEqual({ gte: 100 });
  });

  it("converts prixMax from displayed price to a prixAchat upper bound", () => {
    const q = buildCatalogQuery({ prixMax: "290" });
    expect(q.where.prixAchat).toEqual({ lte: 200 });
  });

  it("combines prixMin and prixMax into one bound", () => {
    const q = buildCatalogQuery({ prixMin: "145", prixMax: "290" });
    expect(q.where.prixAchat).toEqual({ gte: 100, lte: 200 });
  });

  it("swaps prixMin/prixMax when min is greater than max", () => {
    const q = buildCatalogQuery({ prixMin: "290", prixMax: "145" });
    expect(q.where.prixAchat).toEqual({ gte: 100, lte: 200 });
  });

  it("ignores a negative or non-numeric prixMin", () => {
    expect(buildCatalogQuery({ prixMin: "-10" }).where.prixAchat).toBeUndefined();
    expect(buildCatalogQuery({ prixMin: "abc" }).where.prixAchat).toBeUndefined();
  });
});

describe("buildCatalogQuery (stock)", () => {
  it("does not filter on stock by default", () => {
    expect(buildCatalogQuery({}).where.stockQty).toBeUndefined();
  });

  it("filters to in-stock products when stock=disponible", () => {
    const q = buildCatalogQuery({ stock: "disponible" });
    expect(q.where.stockQty).toEqual({ gt: 0 });
  });

  it("ignores unrecognized stock values", () => {
    expect(buildCatalogQuery({ stock: "bogus" }).where.stockQty).toBeUndefined();
  });
});

describe("buildCatalogQuery (compatible)", () => {
  it("does not filter on compatibility when compatible is not requested", () => {
    const q = buildCatalogQuery({}, { vehicleCodeMoteur: "N47D20" });
    expect(q.where.OR).toBeUndefined();
  });

  it("does not filter on compatibility when no vehicle is active", () => {
    const q = buildCatalogQuery({ compatible: "true" });
    expect(q.where.OR).toBeUndefined();
  });

  it("filters on universel or the exact quoted engine code when both are present", () => {
    const q = buildCatalogQuery({ compatible: "true" }, { vehicleCodeMoteur: "N47D20" });
    expect(q.where.OR).toEqual([
      { compatibilite: { contains: '"universel"' } },
      { compatibilite: { contains: '"N47D20"' } },
    ]);
  });

  it("treats compatible=1 the same as compatible=true", () => {
    const q = buildCatalogQuery({ compatible: "1" }, { vehicleCodeMoteur: "N47D20" });
    expect(q.where.OR).toBeDefined();
  });
});

describe("buildCatalogQuery (malformed input)", () => {
  it("never throws on garbage query params", () => {
    expect(() =>
      buildCatalogQuery({ page: "??", sort: "xxx", prixMin: "nope", prixMax: "-1", stock: "??", compatible: "??" })
    ).not.toThrow();
  });
});

describe("computeTotalPages", () => {
  it("rounds up to a full page", () => {
    expect(computeTotalPages(25, 24)).toBe(2);
  });

  it("returns 1 for an empty result set", () => {
    expect(computeTotalPages(0, 24)).toBe(1);
  });

  it("returns exactly 1 when total equals the page size", () => {
    expect(computeTotalPages(24, 24)).toBe(1);
  });
});
