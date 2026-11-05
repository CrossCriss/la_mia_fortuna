import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { derivePrintLabel, isRealColorName } from "@/lib/color-print";

// Категорії міняються рідко (тільки з адмінки), тому кешуємо на довгий строк
// і скидаємо кеш тегом "categories" при create/update/delete в
// src/app/api/admin/categories/**. Без цього кожен рендер сторінки категорії
// робив зайвий round-trip до БД лише за тим, що майже завжди не змінилось.
export const findCategoryBySlug = unstable_cache(
  async (slug: string) => {
    return prisma.category.findUnique({
      where: { slug },
      include: { children: true },
      relationLoadStrategy: "join",
    });
  },
  ["category-by-slug"],
  { revalidate: 21600, tags: ["categories"] }
);

// "Новинки"/"Акции" фильтруются по флагам товара, обычные категории — по
// categoryId (включая дочерние подкатегории, если это категория верхнего
// уровня вроде "Женское бельё" — см. комментарий в schema.prisma).
export function buildProductWhereForCategory(category: {
  id: string;
  kind: string;
  children: { id: string }[];
}): Prisma.ProductWhereInput {
  if (category.kind === "NEW_ARRIVALS") {
    return { isNew: true, isPublished: true };
  }
  if (category.kind === "PROMO") {
    return { isPromo: true, isPublished: true };
  }

  const categoryIds = [category.id, ...category.children.map((c) => c.id)];
  return { categoryId: { in: categoryIds }, isPublished: true };
}

// "Принт" — не окреме поле в БД, а похідне значення з назви товару (див.
// color-print.ts), тому його не можна відфільтрувати прямо в Prisma
// `where`. Замість цього один раз вибираємо всі товари категорії (ім'я +
// кольори варіантів), рахуємо принт у JS і повертаємо як список доступних
// значень (для чипсів фільтра) та id товарів, що відповідають обраним
// принтам (щоб підмішати `id: { in: ... }` в основний where пагінованого
// запиту). where тут навмисно "категорійний" (без розмір/колір/ціна
// фільтрів) — так само, як для availableSizes/availableColors, щоб набір
// принтів не звужувався при виборі інших фільтрів.
// Витягування "candidates" (весь каталог категорії, незалежно від пагінації)
// — найважча частина цього фільтра і водночас та, що не залежить від
// selectedPrints, тож кешуємо саме її (1 година, без тегу — прийнятна
// затримка оновлення принтів після редагування товару в адмінці, тег тут
// довелось би чіпляти на кожну мутацію товару, що не виправдано складністю).
// Розбір selectedPrints лишається поза кешем — це чиста JS-фільтрація, що
// відрізняється між запитами.
const getPrintCandidates = unstable_cache(
  async (where: Prisma.ProductWhereInput) => {
    return prisma.product.findMany({
      where,
      select: { id: true, name: true, variants: { select: { color: { select: { name: true } } } } },
      relationLoadStrategy: "join",
    });
  },
  ["print-filter-candidates"],
  { revalidate: 3600 }
);

export async function getPrintFilterData(
  where: Prisma.ProductWhereInput,
  selectedPrints: string[]
): Promise<{ availablePrints: string[]; matchedProductIds: string[] }> {
  const candidates = await getPrintCandidates(where);

  const wanted = new Set(selectedPrints);
  const availablePrints = new Set<string>();
  const matchedProductIds: string[] = [];

  for (const product of candidates) {
    const hasRealColor = product.variants.some((v) => isRealColorName(v.color.name));
    if (hasRealColor) continue;

    const printLabel = derivePrintLabel(product.name);
    if (!printLabel) continue;

    availablePrints.add(printLabel);
    if (wanted.has(printLabel)) matchedProductIds.push(product.id);
  }

  return {
    availablePrints: Array.from(availablePrints).sort((a, b) => a.localeCompare(b, "uk")),
    matchedProductIds,
  };
}
