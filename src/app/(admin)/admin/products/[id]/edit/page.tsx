import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";
import { getCategoryOptions } from "@/lib/admin/category-options";

export const dynamic = "force-dynamic";

export default async function AdminEditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const [product, categories, sizes, colors] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: { images: { orderBy: { position: "asc" } }, variants: true },
    }),
    getCategoryOptions(),
    prisma.size.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.color.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Редагування товару</h1>
      <div className="mt-6">
        <ProductForm
          productId={product.id}
          initialValues={{
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            categoryId: product.categoryId,
            price: Number(product.price),
            discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
            fabricComposition: product.fabricComposition ?? "",
            description: product.description ?? "",
            seoDescription: product.seoDescription ?? "",
            isNew: product.isNew,
            isPromo: product.isPromo,
            isPublished: product.isPublished,
            isFeatured: product.isFeatured,
            showOnHomepage: product.showOnHomepage,
            images: product.images.map((image) => ({
              id: image.id,
              url: image.url,
              alt: image.alt ?? "",
            })),
            variants: product.variants.map((variant) => ({
              id: variant.id,
              sizeId: variant.sizeId,
              colorId: variant.colorId,
              stock: variant.stock,
            })),
          }}
          categories={categories}
          sizes={sizes}
          colors={colors}
        />
      </div>
    </div>
  );
}
