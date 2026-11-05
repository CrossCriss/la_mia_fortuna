import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const promoCodes = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(promoCodes);
}

export async function POST(request: Request) {
  const body = await request.json();
  const promoCode = await prisma.promoCode.create({ data: body });
  return NextResponse.json(promoCode, { status: 201 });
}
