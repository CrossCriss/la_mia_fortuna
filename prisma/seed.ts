import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  // Сид ідемпотентний і повністю перезаписує довідники/демо-товари —
  // безпечно, поки в базі немає реальних замовлень.
  await prisma.review.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.size.deleteMany({});
  await prisma.color.deleteMany({});

  // --- Категорії: "Жіноче взуття" + 4 типи взуття, Новинки, Розпродаж ---
  const womenShoes = await prisma.category.upsert({
    where: { slug: "zhinoche-vzuttya" },
    update: {},
    create: { name: "Жіноче взуття", slug: "zhinoche-vzuttya", sortOrder: 1 },
  });

  const shoeTypeDefs = [
    { name: "Черевики", slug: "cherevyky" },
    { name: "Ботинки", slug: "botynky" },
    { name: "Кросівки", slug: "krosivky" },
    { name: "Лофери", slug: "lofery" },
  ];

  const shoeTypeBySlug: Record<string, { id: string }> = {};
  for (const [index, type] of shoeTypeDefs.entries()) {
    shoeTypeBySlug[type.slug] = await prisma.category.upsert({
      where: { slug: type.slug },
      update: {},
      create: { ...type, parentId: womenShoes.id, sortOrder: index },
    });
  }

  await prisma.category.upsert({
    where: { slug: "novynky" },
    update: {},
    create: {
      name: "Новинки",
      slug: "novynky",
      kind: "NEW_ARRIVALS",
      sortOrder: 2,
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
      sortOrder: 3,
    },
  });

  // --- Розмірна сітка — жіноче взуття, 35 до 41 ---
  const sizeValues = ["35", "36", "37", "38", "39", "40", "41"];
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

  // --- Товари за каталогом з макета (Catalog.dc.html) ---
  // Ціни товарів, позначених [ціна] в макеті — клієнтка ще не підтвердила,
  // тут умовний плейсхолдер 2500 грн, замінити перед запуском.
  const PLACEHOLDER_PRICE = 2500;

  type SeedProduct = {
    slug: string;
    name: string;
    sku: string;
    categorySlug: string;
    price: number;
    discountPrice?: number;
    priceConfirmed: boolean;
    description: string;
    isNew?: boolean;
    isPromo?: boolean;
    variants: { size: string; color: string; stock: number }[];
  };

  const allSizesFrom = (from: string, colors: string[], stockPattern: number[]) => {
    const fromIndex = sizeValues.indexOf(from);
    const sizes = sizeValues.slice(fromIndex);
    const variants: { size: string; color: string; stock: number }[] = [];
    colors.forEach((color, colorIndex) => {
      sizes.forEach((size, sizeIndex) => {
        variants.push({ size, color, stock: stockPattern[(colorIndex + sizeIndex) % stockPattern.length] });
      });
    });
    return variants;
  };

  const products: SeedProduct[] = [
    {
      slug: "cherevyky-zymovi-z-khutrom",
      name: "Черевики зимові з хутром",
      sku: "LMF-001",
      categorySlug: "cherevyky",
      price: 2900,
      priceConfirmed: true,
      description:
        "Преміальне взуття з натуральної шкіри. Всередині тепле хутро, максимальний комфорт і найкраща якість. Стильні, теплі та зручні, ідеальний вибір на зиму.",
      isNew: true,
      variants: allSizesFrom("36", ["Чорний", "Шоколад"], [6, 4, 0]),
    },
    {
      slug: "botynky-z-naturalnoyi-shkiry",
      name: "Ботинки з натуральної шкіри",
      sku: "LMF-002",
      categorySlug: "botynky",
      price: 2800,
      priceConfirmed: true,
      description: "Ботинки з натуральної шкіри на щодень — тримають форму і носяться легко.",
      variants: allSizesFrom("35", ["Чорний", "Шоколад", "Нікель"], [5, 3, 7, 0]),
    },
    {
      slug: "cherevyky-nikel",
      name: "Черевики, колір нікель",
      sku: "LMF-003",
      categorySlug: "cherevyky",
      price: 2800,
      priceConfirmed: true,
      description: "Черевики кольору нікель — нейтральний відтінок, що поєднується з усім.",
      variants: allSizesFrom("35", ["Нікель"], [4, 2, 0]),
    },
    {
      slug: "cherevyky-rozovi",
      name: "Черевики зі шкіри, рожеві",
      sku: "LMF-004",
      categorySlug: "cherevyky",
      price: 2300,
      priceConfirmed: true,
      description: "Останні пари — рожеві черевики зі шкіри, лишився один розмір.",
      variants: [{ size: "37", color: "Рожевий", stock: 1 }],
    },
    {
      slug: "krosivky-zymovi-z-khutrom",
      name: "Кросівки зимові з хутром",
      sku: "LMF-005",
      categorySlug: "krosivky",
      price: PLACEHOLDER_PRICE,
      priceConfirmed: false,
      description: "Теплі кросівки з хутром всередині — зимова альтернатива черевикам.",
      isNew: true,
      variants: allSizesFrom("36", ["Чорний"], [8, 5, 0]),
    },
    {
      slug: "cherevyky-na-shnurivtsi-shokolad",
      name: "Черевики на шнурівці, шоколад",
      sku: "LMF-006",
      categorySlug: "cherevyky",
      price: PLACEHOLDER_PRICE,
      priceConfirmed: false,
      description: "Черевики на шнурівці кольору шоколад — колекція Зима 2027.",
      variants: allSizesFrom("36", ["Шоколад"], [6, 3, 0]),
    },
    {
      slug: "chelsi-na-masyvniy-pidoshvi",
      name: "Челсі на масивній підошві",
      sku: "LMF-007",
      categorySlug: "botynky",
      price: PLACEHOLDER_PRICE,
      priceConfirmed: false,
      description: "Челсі на масивній підошві — колекція Зима 2027.",
      variants: allSizesFrom("36", ["Чорний"], [5, 4, 0]),
    },
    {
      slug: "lofery-shkiryani",
      name: "Лофери шкіряні",
      sku: "LMF-008",
      categorySlug: "lofery",
      price: PLACEHOLDER_PRICE,
      priceConfirmed: false,
      description: "Шкіряні лофери — новинка сезону.",
      isNew: true,
      variants: allSizesFrom("36", ["Чорний", "Шоколад"], [4, 6, 0]),
    },
    {
      slug: "krosivky-shkiryani",
      name: "Кросівки шкіряні",
      sku: "LMF-009",
      categorySlug: "krosivky",
      price: PLACEHOLDER_PRICE,
      discountPrice: Math.round(PLACEHOLDER_PRICE * 0.8),
      priceConfirmed: false,
      description: "Шкіряні кросівки — акційна пропозиція.",
      isPromo: true,
      variants: allSizesFrom("36", ["Чорний"], [3, 2, 0]),
    },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        name: p.name,
        sku: p.sku,
        categoryId: shoeTypeBySlug[p.categorySlug].id,
        price: p.price,
        discountPrice: p.discountPrice,
        fabricComposition: "Натуральна шкіра, хутрова підкладка",
        description: p.priceConfirmed
          ? p.description
          : `${p.description} Ціну уточнити з клієнткою перед запуском (зараз плейсхолдер ${PLACEHOLDER_PRICE} грн).`,
        isNew: p.isNew ?? false,
        isPromo: p.isPromo ?? false,
      },
    });

    for (const v of p.variants) {
      await prisma.productVariant.upsert({
        where: {
          productId_sizeId_colorId: {
            productId: product.id,
            sizeId: sizeByValue[v.size].id,
            colorId: colorByName[v.color].id,
          },
        },
        update: { stock: v.stock },
        create: {
          productId: product.id,
          sizeId: sizeByValue[v.size].id,
          colorId: colorByName[v.color].id,
          stock: v.stock,
        },
      });
    }
  }

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
