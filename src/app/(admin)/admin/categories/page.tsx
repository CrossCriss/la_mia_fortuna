import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { CategoryFeaturedToggle } from "@/components/admin/CategoryFeaturedToggle";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  REGULAR: "Звичайна",
  NEW_ARRIVALS: "Новинки",
  PROMO: "Акції",
};

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { parent: true, _count: { select: { products: true } } },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Категорії</h1>
        <Link
          href="/admin/categories/new"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          + Нова категорія
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Назва</th>
              <th className="px-4 py-2 font-medium">Slug</th>
              <th className="px-4 py-2 font-medium">Батьківська</th>
              <th className="px-4 py-2 font-medium">Тип</th>
              <th className="px-4 py-2 font-medium">Товарів</th>
              <th className="px-4 py-2 font-medium">Показ</th>
              <th className="px-4 py-2 font-medium">На головній</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-2 font-medium text-neutral-900">{category.name}</td>
                <td className="px-4 py-2 text-neutral-500">{category.slug}</td>
                <td className="px-4 py-2 text-neutral-500">{category.parent?.name ?? "—"}</td>
                <td className="px-4 py-2 text-neutral-500">{KIND_LABELS[category.kind]}</td>
                <td className="px-4 py-2 text-neutral-500">{category._count.products}</td>
                <td className="px-4 py-2 text-neutral-500">{category.isVisible ? "Так" : "Ні"}</td>
                <td className="px-4 py-2 text-neutral-500">
                  <CategoryFeaturedToggle
                    categoryId={category.id}
                    initialValue={category.isFeaturedOnHome}
                  />
                </td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-4">
                    <Link
                      href={`/admin/categories/${category.id}/edit`}
                      className="text-sm text-neutral-600 hover:underline"
                    >
                      Редагувати
                    </Link>
                    <DeleteButton
                      url={`/api/admin/categories/${category.id}`}
                      confirmMessage={`Видалити категорію "${category.name}"?`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-neutral-400">
                  Категорій ще немає.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
