import { describe, expect, it } from "vitest";
import { buildGalleryImages } from "./product-gallery";

const photos = [
  { url: "https://x/a.jpg", alt: "a" },
  { url: "https://x/b.jpg", alt: null },
];

describe("buildGalleryImages", () => {
  it("puts the size chart last and keeps product photos first", () => {
    const slides = buildGalleryImages(photos, "https://x/chart.jpg", "Туфлі");
    expect(slides).toHaveLength(3);
    expect(slides[0].url).toBe("https://x/a.jpg");
    expect(slides[2]).toEqual({
      url: "https://x/chart.jpg",
      alt: "Таблиця розмірів - Туфлі",
      contain: true,
    });
  });

  it("adds nothing without a chart", () => {
    expect(buildGalleryImages(photos, null, "T")).toHaveLength(2);
    expect(buildGalleryImages(photos, "", "T")).toHaveLength(2);
  });

  it("does not touch the cover (first product photo)", () => {
    expect(buildGalleryImages([], "https://x/chart.jpg", "T")[0].contain).toBe(true);
    expect(photos[0].url).toBe("https://x/a.jpg");
  });
});
