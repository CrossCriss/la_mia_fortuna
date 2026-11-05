import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { categoryFormSchema } from "@/lib/admin/category-schema";

const categoryPatchSchema = z.object({
  isFeaturedOnHome: z.boolean(),
});

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const category = await prisma.category.findUnique({ where: { id: params.id } });
  if (!category) {
    return NextResponse.json({ error: "Категорію не знайдено" }, { status: 404 });
  }
  return NextResponse.json(category);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = categoryFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некоректні дані", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.parentId === params.id) {
    return NextResponse.json(
      { error: "Категорія не може бути батьківською сама для себе" },
      { status: 400 }
    );
  }

  try {
    const category = await prisma.category.update({
      where: { id: params.id },
      data: parsed.data,
    });
    revalidateTag("categories");
    return NextResponse.json(category);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Категорія з таким slug вже існує" }, { status: 409 });
    }
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Категорію не знайдено" }, { status: 404 });
    }
    throw error;
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = categoryPatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некоректні дані", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const category = await prisma.category.update({
      where: { id: params.id },
      data: parsed.data,
    });
    revalidateTag("categories");
    return NextResponse.json(category);
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Категорію не знайдено" }, { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.category.delete({ where: { id: params.id } });
    revalidateTag("categories");
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.code === "P2003") {
      return NextResponse.json(
        { error: "Не можна видалити категорію, поки в ній є товари або підкатегорії" },
        { status: 409 }
      );
    }
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Категорію не знайдено" }, { status: 404 });
    }
    throw error;
  }
}
