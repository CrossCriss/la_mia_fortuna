import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { categoryFormSchema } from "@/lib/admin/category-schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await prisma.category.findMany({
    include: { parent: true, _count: { select: { products: true, children: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = categoryFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некоректні дані", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const category = await prisma.category.create({ data: parsed.data });
    revalidateTag("categories");
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Категорія з таким slug вже існує" }, { status: 409 });
    }
    throw error;
  }
}
