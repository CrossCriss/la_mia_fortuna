import { describe, it, expect } from "vitest";
import {
  buildEffectivePriceWhere,
  buildOrderBy,
  paginateIds,
  parsePriceRange,
  parseSort,
  sortIdsByEffectivePrice,
} from "./catalog-params";

describe("parseSort", () => {
  it("accepts all known values", () => {
    for (const s of ["default", "price_asc", "price_desc", "new"]) {
      expect(parseSort(s)).toBe(s);
    }
  });
  it("falls back to default", () => {
    expect(parseSort(undefined)).toBe("default");
    expect(parseSort("")).toBe("default");
    expect(parseSort("junk")).toBe("default");
  });
});

describe("parsePriceRange", () => {
  it("strips inner spaces", () => {
    expect(parsePriceRange("2 300", undefined)).toEqual({ min: 2300 });
  });
  it("rejects invalid values", () => {
    expect(parsePriceRange("abc", "-5")).toEqual({});
    expect(parsePriceRange("10.5", "")).toEqual({});
    expect(parsePriceRange(undefined, undefined)).toEqual({});
  });
  it("swaps min and max", () => {
    expect(parsePriceRange("500", "100")).toEqual({ min: 100, max: 500 });
  });
  it("enforces the limit", () => {
    expect(parsePriceRange("0", "1000000")).toEqual({ min: 0, max: 1000000 });
    expect(parsePriceRange("1000001", "5")).toEqual({ max: 5 });
  });
});

describe("buildEffectivePriceWhere", () => {
  it("returns undefined without bounds", () => {
    expect(buildEffectivePriceWhere({})).toBeUndefined();
  });
  it("handles min only", () => {
    expect(buildEffectivePriceWhere({ min: 100 })).toEqual({
      OR: [
        { discountPrice: null, price: { gte: 100 } },
        { discountPrice: { gte: 100 } },
      ],
    });
  });
  it("handles max only", () => {
    expect(buildEffectivePriceWhere({ max: 900 })).toEqual({
      OR: [
        { discountPrice: null, price: { lte: 900 } },
        { discountPrice: { lte: 900 } },
      ],
    });
  });
  it("handles both", () => {
    const r = { gte: 100, lte: 900 };
    expect(buildEffectivePriceWhere({ min: 100, max: 900 })).toEqual({
      OR: [{ discountPrice: null, price: r }, { discountPrice: r }],
    });
  });
});

describe("buildOrderBy", () => {
  it("maps sorts", () => {
    expect(buildOrderBy("default")).toEqual([{ createdAt: "desc" }]);
    expect(buildOrderBy("new")).toEqual([{ isNew: "desc" }, { createdAt: "desc" }]);
    expect(buildOrderBy("price_asc")).toBeNull();
    expect(buildOrderBy("price_desc")).toBeNull();
  });
});

describe("sortIdsByEffectivePrice", () => {
  const d = (n: number) => new Date(2026, 0, n);
  const rows = [
    { id: "a", price: 2500, discountPrice: null, createdAt: d(1) },
    { id: "b", price: "3000", discountPrice: "2000", createdAt: d(2) },
    { id: "c", price: { toString: () => "1000" }, discountPrice: null, createdAt: d(3) },
  ];
  it("sorts ascending by effective price", () => {
    expect(sortIdsByEffectivePrice(rows, "asc")).toEqual(["c", "b", "a"]);
  });
  it("sorts descending by effective price", () => {
    expect(sortIdsByEffectivePrice(rows, "desc")).toEqual(["a", "b", "c"]);
  });
  it("breaks ties by date desc then id asc", () => {
    const tie = [
      { id: "x", price: 100, discountPrice: null, createdAt: d(1) },
      { id: "y", price: 100, discountPrice: null, createdAt: d(5) },
      { id: "b", price: 100, discountPrice: null, createdAt: d(5) },
    ];
    expect(sortIdsByEffectivePrice(tie, "asc")).toEqual(["b", "y", "x"]);
    expect(sortIdsByEffectivePrice(tie, "desc")).toEqual(["b", "y", "x"]);
  });
});

describe("paginateIds", () => {
  it("handles an empty list", () => {
    expect(paginateIds([], 1, 12)).toEqual({ pageIds: [], page: 1, totalPages: 1 });
  });
  it("clamps out-of-range pages", () => {
    const ids = ["1", "2", "3"];
    expect(paginateIds(ids, 99, 2)).toEqual({ pageIds: ["3"], page: 2, totalPages: 2 });
    expect(paginateIds(ids, 0, 2)).toEqual({ pageIds: ["1", "2"], page: 1, totalPages: 2 });
  });
  it("returns a partial last page", () => {
    const ids = ["1", "2", "3", "4", "5"];
    expect(paginateIds(ids, 3, 2).pageIds).toEqual(["5"]);
  });
});
