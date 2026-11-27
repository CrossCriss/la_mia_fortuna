import type { GridProduct } from "@/components/catalog/ProductGrid";

export type { GridProduct };

const ID_RE = /^[a-z0-9]{10,40}$/i;

export function parseIdsParam(value: string | null, max = 50): string[] {
  if (!value) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of value.split(",")) {
    const id = part.trim();
    if (!ID_RE.test(id) || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
    if (result.length >= max) break;
  }
  return result;
}

type NumLike = { toString(): string } | number;

export type RawCardProduct = {
  id: string;
  slug: string;
  name: string;
  price: NumLike;
  discountPrice: NumLike | null;
  isNew: boolean;
  isPromo: boolean;
  images: { url: string }[];
  variants: {
    id: string;
    stock: number;
    size: { value: string; sortOrder: number };
    color: { name: string; hex: string };
  }[];
};

export function toGridProduct(product: RawCardProduct): GridProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: Number(product.price),
    discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
    isNew: product.isNew,
    isPromo: product.isPromo,
    images: product.images,
    variants: product.variants
      .slice()
      .sort((a, b) => a.size.sortOrder - b.size.sortOrder)
      .map((variant) => ({
        id: variant.id,
        size: variant.size.value,
        color: variant.color.name,
        colorHex: variant.color.hex,
        stock: variant.stock,
      })),
  };
}

export function orderByIds<T extends { id: string }>(products: T[], ids: string[]): T[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  const result: T[] = [];
  for (const id of ids) {
    const p = byId.get(id);
    if (p) result.push(p);
  }
  return result;
}
