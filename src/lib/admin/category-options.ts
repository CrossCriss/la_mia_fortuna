import { prisma } from "@/lib/prisma";

// Плаский список категорій з "Батько > Дитина" підписом — для <select> у формі товару.
export async function getCategoryOptions() {
  const categories = await prisma.category.findMany({
    include: { parent: true },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
  });

  return categories.map((category) => ({
    id: category.id,
    label: category.parent ? `${category.parent.name} > ${category.name}` : category.name,
  }));
}
