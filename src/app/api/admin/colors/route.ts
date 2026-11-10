import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { colorFormSchema } from "@/lib/admin/color-schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const colors = await prisma.color.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(colors);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = colorFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некоректні дані", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const color = await prisma.color.create({ data: parsed.data });
    return NextResponse.json(color, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Такий колір вже є в списку" }, { status: 409 });
    }
    throw error;
  }
}
