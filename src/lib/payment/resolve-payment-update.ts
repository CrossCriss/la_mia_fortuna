import type { PaymentWebhookResult } from "./types";

export type PaymentOrderSnapshot = {
  status: string;
  paymentStatus: string;
  total: number; // у гривнях
  paymentProviderInvoiceId: string | null;
};

export type PaymentUpdateDecision =
  | { kind: "update"; paymentStatus: string; status: string; becamePaid: boolean }
  | { kind: "ignore"; reason: string };

function toKopecks(amount: number) {
  return Math.round(amount * 100);
}

// Чиста функція: вирішує, як вебхук змінює Order. Проміжні (PENDING) та
// запізнілі вебхуки не псують статус, оплата зараховується лише при збігу
// рахунку та суми.
export function resolvePaymentUpdate(
  order: PaymentOrderSnapshot,
  result: Pick<PaymentWebhookResult, "status" | "amount" | "invoiceId">
): PaymentUpdateDecision {
  if (result.status === "PENDING") {
    return { kind: "ignore", reason: "pending_status" };
  }

  if (order.paymentStatus === "REFUNDED") {
    return { kind: "ignore", reason: "already_refunded" };
  }

  if (order.paymentProviderInvoiceId && order.paymentProviderInvoiceId !== result.invoiceId) {
    return { kind: "ignore", reason: "invoice_mismatch" };
  }

  if (order.paymentStatus === "PAID") {
    if (result.status === "REFUNDED") {
      return { kind: "update", paymentStatus: "REFUNDED", status: order.status, becamePaid: false };
    }
    return { kind: "ignore", reason: "already_paid" };
  }

  if (result.status === "PAID") {
    if (result.amount !== null && toKopecks(result.amount) !== toKopecks(order.total)) {
      return { kind: "ignore", reason: "amount_mismatch" };
    }
    return {
      kind: "update",
      paymentStatus: "PAID",
      status: order.status === "NEW" ? "CONFIRMED" : order.status,
      becamePaid: true,
    };
  }

  // FAILED або REFUNDED при paymentStatus PENDING/FAILED
  return { kind: "update", paymentStatus: result.status, status: order.status, becamePaid: false };
}
