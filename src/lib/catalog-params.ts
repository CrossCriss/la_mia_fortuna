import type { Prisma } from "@prisma/client";

export const CATALOG_SORTS = ["default", "price_asc", "price_desc", "new"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export const SORT_LABELS: Record<CatalogSort, string> = {
  default: "Рекомендовані",
  price_asc: "Спочатку дешевші",
  price_desc: "Спочатку дорожчі",
  new: "Новинки",
};

export function parseSort(value: string | undefined): CatalogSort {
  return (CATALOG_SORTS as readonly string[]).includes(value ?? "")
    ? (value as CatalogSort)
    : "default";
}

const PRICE_LIMIT = 1_000_000;

function parsePriceValue(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const cleaned = raw.replace(/\s+/g, "");
  if (!/^\d+$/.test(cleaned)) return undefined;
  const n = Number(cleaned);
  if (!Number.isSafeInteger(n) || n < 0 || n > PRICE_LIMIT) return undefined;
  return n;
}

export function parsePriceRange(
  min?: string,
  max?: string,
): { min?: number; max?: number } {
  let a = parsePriceValue(min);
  let b = parsePriceValue(max);
  if (a !== undefined && b !== undefined && a > b) {
    [a, b] = [b, a];
  }
  const result: { min?: number; max?: number } = {};
  if (a !== undefined) result.min = a;
  if (b !== undefined) result.max = b;
  return result;
}

export function buildEffectivePriceWhere(range: {
  min?: number;
  max?: number;
}): Prisma.ProductWhereInput | undefined {
  if (range.min === undefined && range.max === undefined) return undefined;
  const r: { gte?: number; lte?: number } = {};
  if (range.min !== undefined) r.gte = range.min;
  if (range.max !== undefined) r.lte = range.max;
  return {
    OR: [{ discountPrice: null, price: r }, { discountPrice: r }],
  };
}

export function buildOrderBy(
  sort: CatalogSort,
): Prisma.ProductOrderByWithRelationInput[] | null {
  switch (sort) {
    case "default":
      return [{ createdAt: "desc" }];
    case "new":
      return [{ isNew: "desc" }, { createdAt: "desc" }];
    default:
      return null;
  }
}

export type DecimalLike = number | string | { toString(): string };

export function sortIdsByEffectivePrice(
  rows: {
    id: string;
    price: DecimalLike;
    discountPrice: DecimalLike | null;
    createdAt: Date;
  }[],
  direction: "asc" | "desc",
): string[] {
  const sign = direction === "asc" ? 1 : -1;
  return rows
    .map((r) => ({
      id: r.id,
      createdAt: r.createdAt.getTime(),
      eff: Number(String(r.discountPrice ?? r.price)),
    }))
    .sort((x, y) => {
      if (x.eff !== y.eff) return (x.eff - y.eff) * sign;
      if (x.createdAt !== y.createdAt) return y.createdAt - x.createdAt;
      return x.id < y.id ? -1 : x.id > y.id ? 1 : 0;
    })
    .map((r) => r.id);
}

export function paginateIds(
  ids: string[],
  requestedPage: number,
  pageSize: number,
): { pageIds: string[]; page: number; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(ids.length / pageSize));
  const req = Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1;
  const page = Math.min(Math.max(req, 1), totalPages);
  const start = (page - 1) * pageSize;
  return { pageIds: ids.slice(start, start + pageSize), page, totalPages };
}
