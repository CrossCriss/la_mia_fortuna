import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolvePaymentUpdate } from "./resolve-payment-update";
import type { PaymentWebhookResult } from "./types";
import { formatPaidMessage, sendTelegramMessage } from "@/lib/notify/telegram";

// Спільна логіка застосування результату вебхука (LiqPay callback /
// Monobank webhook) до Order. Рішення про перехід статусу приймає чиста
// функція resolvePaymentUpdate; тут лише пошук замовлення і умовне
// оновлення (updateMany з перевіркою попереднього paymentStatus), щоб
// паралельні вебхуки не перезаписали один одного.
export async function applyPaymentWebhook(
  result: PaymentWebhookResult
): Promise<{ orderId: string; becamePaid: boolean } | null> {
  const order = await prisma.order.findUnique({ where: { orderNumber: result.orderNumber } });

  if (!order) {
    console.error(`Webhook для невідомого замовлення: ${result.orderNumber}`);
    return null;
  }

  const decision = resolvePaymentUpdate(
    {
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: Number(order.total),
      paymentProviderInvoiceId: order.paymentProviderInvoiceId,
    },
    result
  );

  if (decision.kind === "ignore") {
    console.warn(`Webhook проігноровано для ${result.orderNumber}: ${decision.reason}`);
    return null;
  }

  const updated = await prisma.order.updateMany({
    where: { id: order.id, paymentStatus: order.paymentStatus },
    data: {
      paymentStatus: decision.paymentStatus as PaymentStatus,
      status: decision.status as OrderStatus,
      paymentProviderInvoiceId: result.invoiceId,
      paymentProviderPayload: result.rawPayload as object,
    },
  });

  if (updated.count !== 1) return null;

  // Сповіщення в Telegram-групу клієнтки про успішну оплату. sendTelegramMessage
  // не кидає, але try/catch лишаємо: збій сповіщення не повинен ламати вебхук.
  if (decision.becamePaid) {
    try {
      await sendTelegramMessage(formatPaidMessage(order.orderNumber, Number(order.total)));
    } catch (error) {
      console.error("Не вдалося надіслати сповіщення про оплату:", error instanceof Error ? error.message : error);
    }
  }

  return { orderId: order.id, becamePaid: decision.becamePaid };
}
