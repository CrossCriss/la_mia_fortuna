import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const updateOrderSchema = z.object({
  status: z.enum(["NEW", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELED"]).optional(),
  // Реального LiqPay-колбека ще немає — адмін проставляє PAID вручну після
  // підтвердження оплати, це і є тригер нарахування накопичувальної знижки
  // для LiqPay-замовлень (див. src/lib/loyalty.ts).
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
  trackingNumber: z.string().trim().optional(),
});

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Замовлення не знайдено" }, { status: 404 });
  }
  return NextResponse.json(order);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = updateOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некоректні дані", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.order.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json(order);
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Замовлення не знайдено" }, { status: 404 });
    }
    throw error;
  }
}
