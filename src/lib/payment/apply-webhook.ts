import { prisma } from "@/lib/prisma";
import type { PaymentWebhookResult } from "./types";

// Спільна логіка застосування результату вебхука (LiqPay callback /
// Monobank webhook) до Order. Статус замовлення підіймаємо NEW → CONFIRMED
// лише якщо він досі NEW — адмін міг вже вручну просунути замовлення далі,
// вебхук не повинен це відкочувати.
export async function applyPaymentWebhook(result: PaymentWebhookResult) {
  const order = await prisma.order.findUnique({ where: { orderNumber: result.orderNumber } });

  if (!order) {
    console.error(`Webhook для невідомого замовлення: ${result.orderNumber}`);
    return;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: result.isPaid ? "PAID" : "FAILED",
      paymentProviderInvoiceId: result.invoiceId,
      paymentProviderPayload: result.rawPayload as object,
      status: result.isPaid && order.status === "NEW" ? "CONFIRMED" : order.status,
    },
  });
}
