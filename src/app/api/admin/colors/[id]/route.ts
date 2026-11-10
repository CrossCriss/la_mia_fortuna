import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.color.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.code === "P2003") {
      return NextResponse.json(
        { error: "Не можна видалити колір, поки є товари з цим кольором" },
        { status: 409 }
      );
    }
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Колір не знайдено" }, { status: 404 });
    }
    throw error;
  }
}
