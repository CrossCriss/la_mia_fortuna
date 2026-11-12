import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const promoCodes = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(promoCodes);
}
