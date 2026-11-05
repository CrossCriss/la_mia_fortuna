import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  const [categories, featuredOnHomeCount] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.category.count({ where: { isFeaturedOnHome: true } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Нова категорія</h1>
      <div className="mt-6">
        <CategoryForm
          initialValues={{
            name: "",
            slug: "",
            parentId: null,
            kind: "REGULAR",
            sortOrder: 0,
            isVisible: true,
            isFeaturedOnHome: false,
          }}
          parentOptions={categories}
          featuredOnHomeCount={featuredOnHomeCount}
        />
      </div>
    </div>
  );
}
