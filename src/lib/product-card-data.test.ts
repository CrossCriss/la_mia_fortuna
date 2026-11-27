import { describe, expect, it } from "vitest";
import { orderByIds, parseIdsParam, toGridProduct } from "./product-card-data";

describe("parseIdsParam", () => {
  it("returns empty for null and empty", () => {
    expect(parseIdsParam(null)).toEqual([]);
    expect(parseIdsParam("")).toEqual([]);
  });

  it("drops junk, trims, dedups and keeps order", () => {
    const a = "abcdefghij1";
    const b = "klmnopqrst2";
    expect(parseIdsParam(` ${b} ,bad,${a},${b},a b c d e f g h,../etc/passwd`)).toEqual([b, a]);
  });

  it("respects max", () => {
    const ids = Array.from({ length: 5 }, (_, i) => `abcdefghi${i}x`);
    expect(parseIdsParam(ids.join(","), 3)).toEqual(ids.slice(0, 3));
  });
});

describe("toGridProduct", () => {
  it("maps decimals and sorts variants by size", () => {
    const result = toGridProduct({
      id: "p1",
      slug: "s",
      name: "N",
      price: { toString: () => "1999.50" },
      discountPrice: { toString: () => "1500" },
      isNew: true,
      isPromo: false,
      images: [{ url: "u" }],
      variants: [
        { id: "v2", stock: 0, size: { value: "40", sortOrder: 5 }, color: { name: "Чорний", hex: "#000" } },
        { id: "v1", stock: 3, size: { value: "36", sortOrder: 1 }, color: { name: "Білий", hex: "#fff" } },
      ],
    });
    expect(result.price).toBe(1999.5);
    expect(result.discountPrice).toBe(1500);
    expect(result.variants?.map((v) => v.id)).toEqual(["v1", "v2"]);
    expect(result.variants?.[0]).toEqual({ id: "v1", size: "36", color: "Білий", colorHex: "#fff", stock: 3 });
  });

  it("keeps null discount", () => {
    const result = toGridProduct({
      id: "p", slug: "s", name: "N", price: 10, discountPrice: null,
      isNew: false, isPromo: false, images: [], variants: [],
    });
    expect(result.discountPrice).toBeNull();
  });
});

describe("orderByIds", () => {
  it("orders by ids and skips missing", () => {
    const products = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(orderByIds(products, ["c", "x", "a"])).toEqual([{ id: "c" }, { id: "a" }]);
  });
});
