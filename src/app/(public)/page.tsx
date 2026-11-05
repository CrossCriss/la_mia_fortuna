import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Hero } from "@/components/home/Hero";
import { FeaturedCategorySection } from "@/components/home/FeaturedCategorySection";
import { BenefitsSection } from "@/components/home/BenefitsSection";
import { SizeHelpBanner } from "@/components/home/SizeHelpBanner";
import { InstagramTeaser } from "@/components/home/InstagramTeaser";
import { HowToOrderSteps } from "@/components/home/HowToOrderSteps";
import { buildProductWhereForCategory } from "@/lib/catalog";
import { getHomeBadges } from "@/lib/home-badges";

export const dynamic = "force-dynamic";

async function getFeaturedCategorySections() {
  const categories = await prisma.category.findMany({
    where: { isFeaturedOnHome: true, isVisible: true },
    include: { children: true },
    orderBy: { sortOrder: "asc" },
  });

  const productInclude = {
    images: { orderBy: { position: "asc" as const }, take: 2 },
    variants: { include: { size: true, color: true } },
  };

  return Promise.all(
    categories.map(async (category) => {
      const where = buildProductWhereForCategory(category);

      // Спочатку ручний відбір (showOnHomepage), відсортований за останнім
      // оновленням — без ручного порядку, як домовились. Якщо позначених
      // менше 4, решту місць добираємо найновішими товарами категорії.
      const pinned = await prisma.product.findMany({
        where: { ...where, showOnHomepage: true },
        orderBy: { updatedAt: "desc" },
        take: 4,
        include: productInclude,
      });

      const products =
        pinned.length >= 4
          ? pinned
          : [
              ...pinned,
              ...(await prisma.product.findMany({
                where: { ...where, id: { notIn: pinned.map((p) => p.id) } },
                orderBy: { createdAt: "desc" },
                take: 4 - pinned.length,
                include: productInclude,
              })),
            ];

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        products: products.map((product) => {
          const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
          return {
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: Number(product.price),
            discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
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
            badges: getHomeBadges({
              isFeatured: product.isFeatured,
              createdAt: product.createdAt,
              totalStock,
            }),
          };
        }),
      };
    })
  );
}

async function getTopCategories() {
  return prisma.category.findMany({
    where: { parentId: null, isVisible: true, kind: "REGULAR" },
    include: { children: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
}

async function getReviews() {
  return prisma.review.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });
}

export default async function HomePage() {
  const [topCategories, featuredSections, reviews] = await Promise.all([
    getTopCategories(),
    getFeaturedCategorySections(),
    getReviews(),
  ]);

  // Головна показує 3 типи взуття + плитку "Розпродаж" (не 4-й підтип) —
  // той самий підбір, що і в макеті Main.dc.html, не весь список підкатегорій.
  const shoeTypes = topCategories[0]?.children ?? [];
  const homeCategoryTiles = [
    ...shoeTypes.slice(0, 3).map((c) => ({ id: c.id, name: c.name, href: `/catalog/${c.slug}` })),
    { id: "aktsii", name: "Розпродаж", href: "/catalog/aktsii" },
  ];

  return (
    <div>
      <Hero />

      <div className="mx-auto max-w-6xl px-4 md:px-10">
        {homeCategoryTiles.length > 0 && (
          <section className="py-12">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {homeCategoryTiles.map((category) => (
                <Link key={category.id} href={category.href} className="group flex flex-col gap-3">
                  <div className="h-[220px] bg-secondary/25 transition-opacity group-hover:opacity-90 lg:h-[340px]" />
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-[26px] font-semibold text-ink">
                      {category.name}
                    </span>
                    <span className="text-sm text-ink-soft">Дивитись</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {featuredSections.map((section) => (
          <FeaturedCategorySection
            key={section.id}
            name={section.name}
            slug={section.slug}
            products={section.products}
          />
        ))}

        <BenefitsSection />
      </div>

      <SizeHelpBanner />

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-10">
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">
            Відгуки
          </span>
          <h2 className="font-display text-[32px] font-semibold leading-[1.05] text-ink md:text-[42px]">
            Живі відгуки клієнток
          </h2>
        </div>
        {reviews.length === 0 ? (
          <p className="mt-6 text-sm text-ink-soft">Відгуків поки немає.</p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {reviews.map((review) => (
              <div key={review.id} className="flex flex-col gap-3">
                {/* Реальних скриншотів відгуків ще нема — беремо зі сторіс "Відгуки" пізніше. */}
                <div className="flex h-[280px] flex-col items-center justify-center gap-2 bg-secondary/30 px-6 text-center text-ink-soft">
                  <span className="text-[12px] uppercase tracking-[0.18em]">Скриншот відгуку</span>
                  <span className="text-[13px]">Беремо зі сторіс «Відгуки»</span>
                </div>
                <span className="text-sm text-ink-soft">
                  {review.authorName} — {review.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <InstagramTeaser />

      <div className="mx-auto max-w-6xl px-4 md:px-10">
        <HowToOrderSteps />
      </div>
    </div>
  );
}
