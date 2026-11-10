import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/checkout-schema";
import { getActivePaymentMethod, getPaymentProvider } from "@/lib/payment";
import type { PaymentInit } from "@/lib/payment/types";

export const dynamic = "force-dynamic";

// POST /api/orders — створення замовлення при оформленні чекауту.
// "ONLINE_CARD" з форми резолвиться тут у реальний PaymentMethod (LIQPAY/
// MONOBANK) за PAYMENT_PROVIDER, і для нього одразу створюється рахунок у
// провайдера — клієнт отримає paymentInit і повинен перейти за ним
// (redirect-url або auto-submit форма), інакше замовлення лишиться NEW/PENDING.
// Клієнт надсилає лише variantId+quantity — ціна, назва, sku, розмір і колір
// підтягуються з БД тут, а не приймаються від клієнта як є.
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некоректні дані замовлення", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { items, email, comment, ...customer } = parsed.data;

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: items.map((item) => item.variantId) } },
    include: { product: true, size: true, color: true },
  });

  if (variants.length !== items.length) {
    return NextResponse.json(
      { error: "Один або декілька товарів у кошику більше не доступні" },
      { status: 400 }
    );
  }

  const variantById = new Map(variants.map((variant) => [variant.id, variant]));

  const orderItems = items.map((item) => {
    const variant = variantById.get(item.variantId)!;
    const price = variant.product.discountPrice ?? variant.product.price;

    return {
      productId: variant.product.id,
      variantId: variant.id,
      productName: variant.product.name,
      sku: variant.sku ?? variant.product.sku,
      size: variant.size.value,
      color: variant.color.name,
      price,
      quantity: item.quantity,
      total: Number(price) * item.quantity,
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);

  const isOnlineCard = customer.paymentMethod === "ONLINE_CARD";
  const paymentMethod = isOnlineCard ? getActivePaymentMethod() : "CASH_ON_DELIVERY";

  const order = await prisma.order.create({
    data: {
      orderNumber: `GP-${Date.now()}`,
      status: "NEW",
      paymentMethod,
      customerName: customer.customerName,
      phone: customer.phone,
      email: email || undefined,
      shippingCity: customer.shippingCity,
      shippingCityRef: customer.shippingCityRef,
      shippingWarehouse: customer.shippingWarehouse,
      shippingWarehouseRef: customer.shippingWarehouseRef,
      comment: comment || undefined,
      subtotal,
      total: subtotal,
      items: { create: orderItems },
    },
    include: { items: true },
  });

  if (!isOnlineCard) {
    return NextResponse.json(order, { status: 201 });
  }

  let paymentInit: PaymentInit;
  try {
    const provider = getPaymentProvider(paymentMethod as "LIQPAY" | "MONOBANK");
    const { invoiceId, init } = await provider.createPayment({
      orderNumber: order.orderNumber,
      amount: Number(order.total),
      description: `Замовлення ${order.orderNumber}, La Mia Fortuna Shoes`,
    });
    await prisma.order.update({ where: { id: order.id }, data: { paymentProviderInvoiceId: invoiceId } });
    paymentInit = init;
  } catch (error) {
    console.error("Не вдалося створити рахунок у платіжного провайдера:", error);
    return NextResponse.json(
      { error: "Не вдалося ініціювати оплату. Спробуйте ще раз або оберіть накладений платіж." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ...order, paymentInit }, { status: 201 });
}
