import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Hero } from "@/components/home/Hero";
import { ContactFloatingBar } from "@/components/home/ContactFloatingBar";
import { FeaturedCategorySection } from "@/components/home/FeaturedCategorySection";
import { BenefitsSection } from "@/components/home/BenefitsSection";
import { SizeHelpBanner } from "@/components/home/SizeHelpBanner";
import { InstagramTeaser } from "@/components/home/InstagramTeaser";
import { HowToOrderSteps } from "@/components/home/HowToOrderSteps";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { REVIEWS } from "@/content/reviews";
import { buildProductWhereForCategory } from "@/lib/catalog";
import { getHomeBadges } from "@/lib/home-badges";
import { getSiteSettings } from "@/lib/site-settings";

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

async function getPromoCategory() {
  return prisma.category.findUnique({ where: { slug: "aktsii" } });
}

export default async function HomePage() {
  const [topCategories, featuredSections, settings, promoCategory] = await Promise.all([
    getTopCategories(),
    getFeaturedCategorySections(),
    getSiteSettings(),
    getPromoCategory(),
  ]);

  // Головна показує 3 сезонні розділи (Зимове/Демісезонне/Літнє взуття) +
  // плитку "Розпродаж" — topCategories вже саме ці 3 сезони (верхній
  // рівень каталогу), тому беремо їх прямо, без занурення в children.
  const homeCategoryTiles = [
    ...topCategories
      .slice(0, 3)
      .map((c) => ({ id: c.id, name: c.name, href: `/catalog/${c.slug}`, imageUrl: c.imageUrl })),
    {
      id: "aktsii",
      name: promoCategory?.name ?? "Розпродаж",
      href: "/catalog/aktsii",
      imageUrl: promoCategory?.imageUrl ?? null,
    },
  ];

  return (
    <div>
      <ContactFloatingBar />
      <Hero
        image={settings.heroImageUrl}
        imageAlt={settings.heroImageAlt ?? undefined}
        seasonalLabel={settings.seasonalLabel}
        collectionHref={
          settings.seasonalCategorySlug ? `/catalog/${settings.seasonalCategorySlug}` : null
        }
      />

      <div className="mx-auto max-w-6xl px-4 md:px-10">
        {/* "Обирають цього сезону" — вище плиток категорій (запит клієнтки від 2026-11-07). */}
        {featuredSections.map((section) => (
          <FeaturedCategorySection
            key={section.id}
            name={section.name}
            slug={section.slug}
            products={section.products}
          />
        ))}

        {homeCategoryTiles.length > 0 && (
          <section className="py-12">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {homeCategoryTiles.map((category) => (
                <Link key={category.id} href={category.href} className="group flex flex-col gap-3">
                  <div className="h-[220px] overflow-hidden bg-secondary/25 transition-opacity group-hover:opacity-90 lg:h-[340px]">
                    {category.imageUrl && (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    )}
                  </div>
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

        <BenefitsSection />
      </div>

      <SizeHelpBanner />

      <ReviewsSection reviews={REVIEWS} />

      <InstagramTeaser />

      <div className="mx-auto max-w-6xl px-4 md:px-10">
        <HowToOrderSteps />
      </div>
    </div>
  );
}
