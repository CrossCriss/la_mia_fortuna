import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_VALUES = ["NEW", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELED"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: status && STATUS_VALUES.includes(status) ? { status: status as any } : undefined,
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}
