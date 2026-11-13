// Чисті функції для SEO-метаданих і JSON-LD (без мережі та БД).

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

// Схлопує пробіли і переноси; якщо текст довший за max, обрізає по межі слова
// і додає "...". Довжина результату не перевищує max.
export function truncateDescription(text: string, max = 160): string {
  const clean = collapseWhitespace(text);
  if (clean.length <= max) return clean;

  const ellipsis = "...";
  const budget = Math.max(max - ellipsis.length, 0);
  let cut = clean.slice(0, budget);

  // Якщо наступний символ не пробіл, ми розрізали слово: відкочуємось до останнього пробілу.
  if (clean[budget] !== " ") {
    const lastSpace = cut.lastIndexOf(" ");
    if (lastSpace > 0) cut = cut.slice(0, lastSpace);
  }

  cut = cut.replace(/[\s,;:.\-]+$/, "");
  return (cut + ellipsis).slice(0, max);
}

function isFilled(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function buildProductDescription(input: {
  name: string;
  seoDescription?: string | null;
  description?: string | null;
}): string {
  const source = isFilled(input.seoDescription)
    ? input.seoDescription
    : isFilled(input.description)
      ? input.description
      : `${input.name} - жіноче взуття La Mia Fortuna Shoes. Натуральна шкіра, власне виробництво, доставка Новою Поштою.`;
  return truncateDescription(source);
}

export type ProductJsonLdInput = {
  name: string;
  description: string;
  slug: string;
  sku: string;
  images: string[];
  // Уже підсумкова ціна (з урахуванням знижки).
  price: number;
  inStock: boolean;
  siteUrl: string;
};

function toAbsoluteUrl(url: string, siteUrl: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${siteUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function buildProductJsonLd(input: ProductJsonLdInput) {
  const siteUrl = input.siteUrl.replace(/\/+$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    sku: input.sku,
    image: input.images.map((url) => toAbsoluteUrl(url, siteUrl)),
    offers: {
      "@type": "Offer",
      priceCurrency: "UAH",
      price: input.price.toFixed(2),
      availability: input.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${siteUrl}/product/${input.slug}`,
    },
  };
}
