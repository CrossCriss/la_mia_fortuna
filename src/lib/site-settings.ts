import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Публічне читання (Header/Footer/головна сторінка) — закешоване в межах
// одного запиту через React cache(), щоб три місця не робили той самий
// SELECT тричі. Якщо рядка SiteSettings ще немає (до першого збереження в
// адмінці) або обрана категорія вже видалена — повертаємо null/відсутній
// seasonalCategorySlug, виклики в компонентах самі ховають елементи, яким
// нема куди вести.
export const getSiteSettings = cache(async () => {
  const settings = await prisma.siteSettings.findFirst();
  if (!settings) {
    return {
      heroImageUrl: null as string | null,
      heroImageAlt: null as string | null,
      seasonalLabel: "Нова колекція",
      seasonalCategorySlug: null as string | null,
      seasonalCategoryName: null as string | null,
    };
  }

  const seasonalCategory = settings.seasonalCategoryId
    ? await prisma.category.findUnique({ where: { id: settings.seasonalCategoryId } })
    : null;

  return {
    heroImageUrl: settings.heroImageUrl,
    heroImageAlt: settings.heroImageAlt,
    seasonalLabel: settings.seasonalLabel,
    seasonalCategorySlug: seasonalCategory?.slug ?? null,
    seasonalCategoryName: seasonalCategory?.name ?? null,
  };
});
