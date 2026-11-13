import { describe, expect, it } from "vitest";
import { buildProductDescription, buildProductJsonLd, truncateDescription } from "./seo";

describe("truncateDescription", () => {
  it("returns short text unchanged", () => {
    expect(truncateDescription("Короткий опис")).toBe("Короткий опис");
  });

  it("collapses spaces and line breaks", () => {
    expect(truncateDescription("  Перший   рядок\n\nдругий\tрядок  ")).toBe("Перший рядок другий рядок");
  });

  it("cuts long text on a word boundary with three dots", () => {
    const text = "слово ".repeat(60).trim();
    const result = truncateDescription(text);
    expect(result.endsWith("...")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(160);
    const body = result.slice(0, -3);
    expect(body.split(" ").every((w) => w === "слово")).toBe(true);
  });

  it("respects a custom max", () => {
    const result = truncateDescription("Натуральна шкіра і власне виробництво у Харкові", 20);
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result.endsWith("...")).toBe(true);
    expect(result).toBe("Натуральна шкіра...");
  });

  it("hard-cuts a single very long word", () => {
    const result = truncateDescription("a".repeat(300), 50);
    expect(result.length).toBe(50);
    expect(result.endsWith("...")).toBe(true);
  });

  it("keeps text of exactly max length", () => {
    const text = "а".repeat(160);
    expect(truncateDescription(text)).toBe(text);
  });
});

describe("buildProductDescription", () => {
  it("prefers seoDescription", () => {
    expect(
      buildProductDescription({ name: "Туфлі", seoDescription: "SEO текст", description: "Опис" }),
    ).toBe("SEO текст");
  });

  it("falls back to description", () => {
    expect(buildProductDescription({ name: "Туфлі", seoDescription: null, description: "Опис" })).toBe("Опис");
  });

  it("falls back to default text with product name", () => {
    const result = buildProductDescription({ name: "Туфлі Роза", seoDescription: null, description: null });
    expect(result).toContain("Туфлі Роза");
    expect(result).toContain("La Mia Fortuna Shoes");
  });

  it("treats whitespace-only strings as missing", () => {
    const result = buildProductDescription({ name: "Балетки", seoDescription: "   \n ", description: "  " });
    expect(result).toContain("Балетки");
    expect(result).toContain("власне виробництво");
  });

  it("truncates long descriptions", () => {
    const result = buildProductDescription({ name: "X", description: "слово ".repeat(100) });
    expect(result.length).toBeLessThanOrEqual(160);
    expect(result.endsWith("...")).toBe(true);
  });
});

describe("buildProductJsonLd", () => {
  const base = {
    name: "Туфлі Роза",
    description: "Опис",
    slug: "tufli-roza",
    sku: "LMF-001",
    images: ["https://cdn.example.com/a.jpg", "/uploads/b.jpg"],
    price: 2499,
    inStock: true,
    siteUrl: "https://lamiafortuna.example",
  };

  it("builds a schema.org Product", () => {
    const ld = buildProductJsonLd(base);
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("Product");
    expect(ld.name).toBe("Туфлі Роза");
    expect(ld.description).toBe("Опис");
    expect(ld.sku).toBe("LMF-001");
  });

  it("returns absolute image urls", () => {
    const ld = buildProductJsonLd(base);
    expect(ld.image).toEqual(["https://cdn.example.com/a.jpg", "https://lamiafortuna.example/uploads/b.jpg"]);
  });

  it("fills offers with UAH, price and url", () => {
    const { offers } = buildProductJsonLd(base);
    expect(offers["@type"]).toBe("Offer");
    expect(offers.priceCurrency).toBe("UAH");
    expect(offers.price).toBe("2499.00");
    expect(offers.url).toBe("https://lamiafortuna.example/product/tufli-roza");
  });

  it("maps availability to InStock and OutOfStock", () => {
    expect(buildProductJsonLd(base).offers.availability).toBe("https://schema.org/InStock");
    expect(buildProductJsonLd({ ...base, inStock: false }).offers.availability).toBe(
      "https://schema.org/OutOfStock",
    );
  });

  it("does not double slashes when siteUrl has a trailing slash", () => {
    const { offers } = buildProductJsonLd({ ...base, siteUrl: "https://lamiafortuna.example/" });
    expect(offers.url).toBe("https://lamiafortuna.example/product/tufli-roza");
  });

  it("handles an empty image list", () => {
    expect(buildProductJsonLd({ ...base, images: [] }).image).toEqual([]);
  });
});
