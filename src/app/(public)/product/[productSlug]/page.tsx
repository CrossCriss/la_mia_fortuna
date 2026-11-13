import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductOptions } from "@/components/product/ProductOptions";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { buildProductWhereForCategory } from "@/lib/catalog";
import { SITE, getSiteUrl } from "@/lib/site-config";
import { buildProductDescription, buildProductJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

const ACCORDION_SECTIONS: {
  title: string;
  text: string;
  link?: { href: string; label: string };
}[] = [
  {
    title: "Розмір і посадка",
    text: "Надішли довжину стопи в сантиметрах, і ми підкажемо розмір для цієї моделі.",
    link: { href: "/size-guide", label: "Розмірна сітка" },
  },
  {
    title: "Доставка та оплата",
    text: "Відправляємо швидко по Україні.",
    link: { href: "/delivery", label: "Детальніше" },
  },
];

// Один запит на рендер: generateMetadata і сторінка ділять результат через cache().
const getProduct = cache(async (slug: string) =>
  prisma.product.findUnique({
    where: { slug, isPublished: true },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { include: { size: true, color: true } },
      category: true,
    },
  }),
);

export async function generateMetadata({
  params,
}: {
  params: { productSlug: string };
}): Promise<Metadata> {
  const product = await getProduct(params.productSlug);
  if (!product) return {};

  const description = buildProductDescription({
    name: product.name,
    seoDescription: product.seoDescription,
    description: product.description,
  });
  const path = `/product/${product.slug}`;
  const firstImage = product.images[0]?.url;
  const finalPrice = product.discountPrice ?? product.price;

  return {
    title: product.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: product.name,
      description,
      url: path,
      // Без фото явно ставимо картинку за замовчуванням з кореневого opengraph-image.tsx,
      // інакше openGraph сторінки повністю замінює батьківський і og:image зникає.
      images: [firstImage ?? "/opengraph-image"],
    },
    other: {
      "product:price:amount": String(Number(finalPrice)),
      "product:price:currency": "UAH",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { productSlug: string };
}) {
  const product = await getProduct(params.productSlug);

  if (!product) notFound();

  const variants = product.variants
    .slice()
    .sort((a, b) => a.size.sortOrder - b.size.sortOrder)
    .map((variant) => ({
      id: variant.id,
      size: variant.size.value,
      color: variant.color.name,
      colorHex: variant.color.hex,
      stock: variant.stock,
    }));

  const relatedRaw = await prisma.product.findMany({
    where: buildProductWhereForCategory({ ...product.category, children: [] }),
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { images: { orderBy: { position: "asc" }, take: 1 }, variants: true },
  });
  const related = relatedRaw
    .filter((p) => p.id !== product.id)
    .slice(0, 4)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: Number(p.price),
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      images: p.images,
    }));

  const jsonLd = buildProductJsonLd({
    name: product.name,
    description: buildProductDescription({
      name: product.name,
      seoDescription: product.seoDescription,
      description: product.description,
    }),
    slug: product.slug,
    sku: product.sku,
    images: product.images.map((image) => image.url),
    price: Number(product.discountPrice ?? product.price),
    inStock: product.variants.some((variant) => variant.stock > 0),
    siteUrl: getSiteUrl(),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="flex flex-wrap gap-2 text-sm text-ink-soft">
        <Link href="/">Головна</Link>
        <span aria-hidden>/</span>
        <Link href={`/catalog/${product.category.slug}`}>{product.category.name}</Link>
        <span aria-hidden>/</span>
        <span>{product.name}</span>
      </div>

      <div className="mt-6 grid gap-12 md:grid-cols-2">
        <ProductGallery images={product.images.map((image) => ({ url: image.url, alt: image.alt }))} />

        <div>
          {product.isNew && (
            <span className="mb-3 inline-flex bg-surface-dark px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide text-background">
              Нова колекція
            </span>
          )}
          <h1 className="font-display text-[42px] font-semibold leading-[1.02] text-ink md:text-[52px]">
            {product.name}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">Артикул: {product.sku}</p>

          <div className="mt-6">
            <ProductOptions
              productSlug={product.slug}
              name={product.name}
              price={Number(product.price)}
              discountPrice={product.discountPrice ? Number(product.discountPrice) : null}
              image={product.images[0]?.url}
              variants={variants}
            />
          </div>

          <a
            href={SITE.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex min-h-14 w-full items-center justify-center border border-ink text-[15px] font-bold text-ink hover:bg-ink hover:text-background"
          >
            Замовити в Telegram
          </a>

          {product.description && (
            <p className="mt-8 text-[15px] leading-relaxed text-ink-soft">{product.description}</p>
          )}

          {product.fabricComposition && (
            <p className="mt-4 text-sm text-ink-soft">
              <span className="font-semibold text-ink">Склад: </span>
              {product.fabricComposition}
            </p>
          )}

          <div className="mt-8 flex flex-col border-t border-border">
            {ACCORDION_SECTIONS.map((section) => (
              <details key={section.title} className="border-b border-border py-4">
                <summary className="flex min-h-7 cursor-pointer list-none items-center justify-between font-bold text-ink [&::-webkit-details-marker]:hidden">
                  {section.title}
                  <span aria-hidden>+</span>
                </summary>
                <p className="mt-3 text-[15px] text-ink-soft">{section.text}</p>
                {section.link && (
                  <Link
                    href={section.link.href}
                    className="mt-3 inline-block text-[15px] font-semibold text-ink underline underline-offset-4"
                  >
                    {section.link.label}
                  </Link>
                )}
              </details>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-[32px] font-semibold text-ink md:text-[44px]">
            З цим дивляться
          </h2>
          <div className="mt-8">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  );
}
