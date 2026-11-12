import { prisma } from "@/lib/prisma";
import { applyPaymentWebhook } from "@/lib/payment/apply-webhook";
import { getMonobankInvoiceStatus } from "@/lib/payment/monobank";

// Публічна зведена інформація про замовлення для сторінки подяки.
// Навмисно без персональних даних покупця: у select їх немає.

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type PublicOrderSummary = {
  orderNumber: string;
  paymentKind: "CARD" | "COD";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  total: number;
  trackingNumber: string | null;
  items: { id: string; name: string; price: number; quantity: number }[];
};

async function readOrder(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber },
    select: {
      orderNumber: true,
      paymentMethod: true,
      paymentStatus: true,
      paymentProviderInvoiceId: true,
      total: true,
      trackingNumber: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          productId: true,
          sku: true,
          productName: true,
          price: true,
          quantity: true,
          product: { select: { slug: true } },
        },
      },
    },
  });
}

export async function getPublicOrderSummary(orderNumber: string): Promise<PublicOrderSummary | null> {
  let order = await readOrder(orderNumber);
  if (!order) return null;
  if (Date.now() - order.createdAt.getTime() > MAX_AGE_MS) return null;

  // Звірка пропущеного вебхука Monobank. Помилки не ламають сторінку.
  if (
    order.paymentMethod === "MONOBANK" &&
    order.paymentStatus === "PENDING" &&
    order.paymentProviderInvoiceId
  ) {
    try {
      const result = await getMonobankInvoiceStatus(order.paymentProviderInvoiceId);
      await applyPaymentWebhook(result);
      const fresh = await readOrder(orderNumber);
      if (fresh) order = fresh;
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      console.error(`Звірка оплати Monobank для ${orderNumber} не вдалась: ${message}`);
    }
  }

  return {
    orderNumber: order.orderNumber,
    paymentKind: order.paymentMethod === "CASH_ON_DELIVERY" ? "COD" : "CARD",
    paymentStatus: order.paymentStatus,
    total: Number(order.total),
    trackingNumber: order.trackingNumber,
    items: order.items.map((item) => ({
      id: item.product?.slug ?? item.productId ?? item.sku,
      name: item.productName,
      price: Number(item.price),
      quantity: item.quantity,
    })),
  };
}
