import { describe, expect, it } from "vitest";
import { productFormSchema } from "./product-schema";

const base = {
  name: "Туфлі",
  categoryId: "c1",
  price: 100,
  discountPrice: null,
  isNew: false,
  isPromo: false,
  isPublished: true,
  isFeatured: false,
  showOnHomepage: false,
  images: [],
  variants: [{ sizeId: "s1", colorId: "c1", stock: 1 }],
};

describe("productFormSchema sizeChartImageUrl", () => {
  it("keeps a url", () => {
    const r = productFormSchema.parse({ ...base, sizeChartImageUrl: "https://x/chart.jpg" });
    expect(r.sizeChartImageUrl).toBe("https://x/chart.jpg");
  });

  it("turns empty, whitespace, null and missing into null", () => {
    for (const value of ["", "   ", null, undefined]) {
      const r = productFormSchema.parse({ ...base, sizeChartImageUrl: value });
      expect(r.sizeChartImageUrl).toBeNull();
    }
  });
});
