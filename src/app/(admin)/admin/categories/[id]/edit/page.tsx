import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  const [category, categories, featuredOnHomeCount] = await Promise.all([
    prisma.category.findUnique({ where: { id: params.id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.category.count({ where: { isFeaturedOnHome: true } }),
  ]);

  if (!category) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Редагування категорії</h1>
      <div className="mt-6">
        <CategoryForm
          categoryId={category.id}
          initialValues={{
            name: category.name,
            slug: category.slug,
            parentId: category.parentId,
            kind: category.kind,
            sortOrder: category.sortOrder,
            isVisible: category.isVisible,
            isFeaturedOnHome: category.isFeaturedOnHome,
          }}
          parentOptions={categories}
          featuredOnHomeCount={featuredOnHomeCount}
        />
      </div>
    </div>
  );
}
