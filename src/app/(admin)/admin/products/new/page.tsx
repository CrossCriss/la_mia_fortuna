import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";
import { getCategoryOptions } from "@/lib/admin/category-options";

export const dynamic = "force-dynamic";

export default async function AdminNewProductPage() {
  const [categories, sizes, colors] = await Promise.all([
    getCategoryOptions(),
    prisma.size.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.color.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Новий товар</h1>
      <div className="mt-6">
        <ProductForm
          initialValues={{
            name: "",
            slug: "",
            sku: "",
            categoryId: "",
            price: 0,
            discountPrice: null,
            fabricComposition: "",
            description: "",
            seoDescription: "",
            isNew: false,
            isPromo: false,
            isPublished: true,
            isFeatured: false,
            showOnHomepage: false,
            images: [],
            variants: [],
          }}
          categories={categories}
          sizes={sizes}
          colors={colors}
        />
      </div>
    </div>
  );
}
