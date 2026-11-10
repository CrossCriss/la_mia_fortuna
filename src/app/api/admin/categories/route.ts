import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { categoryFormSchema } from "@/lib/admin/category-schema";
import { slugify, uniqueSlug } from "@/lib/admin/slugify";

export const dynamic = "force-dynamic";

async function generateSlug(name: string): Promise<string> {
  const base = slugify(name);
  const existing = await prisma.category.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });
  return uniqueSlug(base, new Set(existing.map((c) => c.slug)));
}

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

  const { slug: providedSlug, ...fields } = parsed.data;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = providedSlug?.trim() || (await generateSlug(fields.name));

    try {
      const category = await prisma.category.create({ data: { ...fields, slug } });
      revalidateTag("categories");
      return NextResponse.json(category, { status: 201 });
    } catch (error: any) {
      const isLastAttempt = attempt === 4;
      if (error?.code === "P2002" && !providedSlug?.trim() && !isLastAttempt) continue;
      if (error?.code === "P2002") {
        return NextResponse.json({ error: "Категорія з таким slug вже існує" }, { status: 409 });
      }
      throw error;
    }
  }

  return NextResponse.json({ error: "Не вдалося зберегти категорію" }, { status: 500 });
}
