import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/categories — дерево категорий для меню/каталога.
export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isVisible: true, parentId: null },
    include: { children: true },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(categories);
}
