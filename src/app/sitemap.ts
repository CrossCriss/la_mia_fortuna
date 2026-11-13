import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-config";

// Не пререндеримо на build: список товарів і категорій береться з БД на кожен запит.
export const dynamic = "force-dynamic";

const STATIC_PATHS = [
  "/",
  "/catalog",
  "/about",
  "/delivery",
  "/returns",
  "/contacts",
  "/size-guide",
  "/privacy",
  "/oferta",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
  }));

  // Якщо БД недоступна, віддаємо хоча б статичні адреси, а не падаємо з 500.
  try {
    const [categories, products] = await Promise.all([
      prisma.category.findMany({
        where: { isVisible: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.product.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    for (const category of categories) {
      entries.push({
        url: `${base}/catalog/${encodeURIComponent(category.slug)}`,
        lastModified: category.updatedAt,
      });
    }

    for (const product of products) {
      entries.push({
        url: `${base}/product/${encodeURIComponent(product.slug)}`,
        lastModified: product.updatedAt,
      });
    }
  } catch {
    // Текст помилки Prisma не логуємо: він може містити деталі підключення до БД.
    console.error("[sitemap] не вдалося завантажити категорії та товари, віддано лише статичні адреси");
  }

  return entries;
}
