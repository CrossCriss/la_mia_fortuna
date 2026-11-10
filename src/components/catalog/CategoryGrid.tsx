import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildProductWhereForCategory } from "@/lib/catalog";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";

async function getTopCategoriesWithPreview() {
  const categories = await prisma.category.findMany({
    where: { parentId: null, isVisible: true },
    include: { children: true },
    orderBy: { sortOrder: "asc" },
  });

  return Promise.all(
    categories.map(async (category) => {
      // Обкладинка категорії (imageUrl) має пріоритет — якщо її немає,
      // підставляємо фото першого товару категорії як запасний варіант.
      if (category.imageUrl) {
        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          previewImage: category.imageUrl,
        };
      }

      const where = buildProductWhereForCategory(category);
      const product = await prisma.product.findFirst({
        where,
        orderBy: { createdAt: "desc" },
        include: { images: { orderBy: { position: "asc" }, take: 1 } },
      });

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        previewImage: product?.images[0]?.url ?? null,
      };
    })
  );
}

export async function CategoryGrid() {
  const categories = await getTopCategoriesWithPreview();

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/catalog/${category.slug}`}
          className="group relative block aspect-square overflow-hidden rounded-2xl bg-secondary/25"
        >
          {category.previewImage ? (
            <img
              src={category.previewImage}
              alt={category.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <PlaceholderImage />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
          <span className="absolute bottom-3 left-3 right-3 text-sm font-medium text-white md:text-base">
            {category.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
