import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  // Сид тільки додає відсутнє (upsert, update: {}) і нічого не видаляє —
  // раніше тут були deleteMany, які стерли товари, додані вручну.
  // --- Категорії: 3 сезонні розділи + підкатегорії типів (запит клієнтки
  // від 2026-11-06), Новинки, Розпродаж. "Жіноче взуття" як окрема
  // обгортка більше не потрібна — весь магазин жіноче взуття, сезон тепер
  // є верхнім рівнем каталогу. Slug підкатегорій префіксовано сезоном, бо
  // "Кеди"/"Кросівки" повторюються в кількох сезонах — це різні категорії
  // з однаковою назвою для показу, не одна спільна.
  const seasonDefs = [
    {
      name: "Зимове взуття",
      slug: "zymove-vzuttya",
      sortOrder: 0,
      types: [
        { name: "Угги", slug: "uggy" },
        { name: "Кеди", slug: "zymovi-kedy" },
        { name: "Кросівки", slug: "zymovi-krosivky" },
        { name: "Черевики", slug: "zymovi-cherevyky" },
      ],
    },
    {
      name: "Демісезонне взуття",
      slug: "demisezonne-vzuttya",
      sortOrder: 1,
      types: [
        { name: "Кеди", slug: "demisezonni-kedy" },
        { name: "Кросівки", slug: "demisezonni-krosivky" },
        { name: "Туфлі", slug: "tufli" },
        { name: "Лофери", slug: "lofery" },
      ],
    },
    {
      name: "Літнє взуття",
      slug: "litnie-vzuttya",
      sortOrder: 2,
      types: [
        { name: "Кеди", slug: "litni-kedy" },
        { name: "Кросівки", slug: "litni-krosivky" },
        { name: "Босоніжки", slug: "bosonizhky" },
      ],
    },
  ];

  const categoryBySlug: Record<string, { id: string }> = {};
  for (const season of seasonDefs) {
    const seasonCategory = await prisma.category.upsert({
      where: { slug: season.slug },
      update: {},
      create: { name: season.name, slug: season.slug, sortOrder: season.sortOrder },
    });
    categoryBySlug[season.slug] = seasonCategory;

    for (const [index, type] of season.types.entries()) {
      categoryBySlug[type.slug] = await prisma.category.upsert({
        where: { slug: type.slug },
        update: {},
        create: { ...type, parentId: seasonCategory.id, sortOrder: index },
      });
    }
  }

  await prisma.category.upsert({
    where: { slug: "novynky" },
    update: {},
    create: {
      name: "Новинки",
      slug: "novynky",
      kind: "NEW_ARRIVALS",
      sortOrder: 3,
      // Вмикає секцію-підбірку "Обирають цього сезону" на головній (page.tsx).
      isFeaturedOnHome: true,
    },
  });

  await prisma.category.upsert({
    where: { slug: "aktsii" },
    update: {},
    create: {
      name: "Розпродаж",
      slug: "aktsii",
      kind: "PROMO",
      sortOrder: 4,
    },
  });

  // --- Розмірна сітка — за запитом клієнтки від 2026-11-06: з 36 по 41 (35 прибрано) ---
  const sizeValues = ["36", "37", "38", "39", "40", "41"];
  const sizeByValue: Record<string, { id: string }> = {};
  for (const [index, value] of sizeValues.entries()) {
    sizeByValue[value] = await prisma.size.upsert({
      where: { value },
      update: {},
      create: { value, sortOrder: index },
    });
  }

  // --- Кольори зі swatch, за макетом (Catalog.dc.html) ---
  const colorDefs = [
    { name: "Чорний", hex: "#1A1411" },
    { name: "Шоколад", hex: "#4A2F22" },
    { name: "Нікель", hex: "#B9B2A8" },
    { name: "Рожевий", hex: "#E3C7C4" },
  ];
  const colorByName: Record<string, { id: string }> = {};
  for (const color of colorDefs) {
    colorByName[color.name] = await prisma.color.upsert({
      where: { name: color.name },
      update: {},
      create: color,
    });
  }

  // --- Товарів у сіді свідомо немає: клієнтка вносить реальний асортимент
  // сама через адмінку (домовленість від 2026-11-05/06) — фейкові
  // демо-товари з її Instagram лише заплутували б категорії після
  // переходу на сезонну структуру. Довідники (категорії/розміри/кольори)
  // та адмін-акаунт сід усе одно наповнює, щоб каталог одразу був готовий
  // до наповнення.

  // --- Відгуки — плейсхолдери, реальні скриншоти зі сторіс "Відгуки" ще не надані ---
  const reviews = [
    { id: "seed-review-1", authorName: "Клієнтка 1", rating: 5, text: "[Текст відгуку — буде замінено реальним]" },
    { id: "seed-review-2", authorName: "Клієнтка 2", rating: 5, text: "[Текст відгуку — буде замінено реальним]" },
    { id: "seed-review-3", authorName: "Клієнтка 3", rating: 5, text: "[Текст відгуку — буде замінено реальним]" },
  ];
  for (const review of reviews) {
    await prisma.review.upsert({
      where: { id: review.id },
      update: {},
      create: { ...review, isPublished: true },
    });
  }

  // --- Налаштування головної (банер + сезонна колекція) — лише якщо рядка
  // ще немає, щоб повторний сід не затирав те, що клієнтка вже змінила в
  // адмінці (/admin/homepage). За замовчуванням "Зима 2027" веде на розділ
  // "Зимове взуття" — тепер це верхній рівень каталогу замість колишньої
  // обгортки "Жіноче взуття".
  const existingSettings = await prisma.siteSettings.findFirst();
  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: { seasonalLabel: "Зима 2027", seasonalCategoryId: categoryBySlug["zymove-vzuttya"].id },
    });
  }

  // --- Єдиний admin-акаунт (email/пароль беруться з .env, хеш оновлюється при кожному сіді) ---
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@la-mia-fortuna.local").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash: hashPassword(adminPassword) },
    create: {
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
      name: "Адміністратор",
      role: "ADMIN",
    },
  });

  console.log("Seed завершено.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
