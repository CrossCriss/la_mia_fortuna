import { liqpayProvider } from "./liqpay";
import { monobankProvider } from "./monobank";
import type { PaymentProvider } from "./types";

export type ActivePaymentMethod = "LIQPAY" | "MONOBANK";

// Monobank (Plata by mono) — дешевший еквайринг за даними на момент вибору
// (~1.3% проти ~2.75% у LiqPay, перевірте актуальні тарифи перед запуском:
// mono.bank/plata, liqpay.ua/tariffs) — тому дефолт. Перемкнути на LiqPay —
// лише змінна середовища, обидва провайдери вже реалізовані однаково.
export function getActivePaymentMethod(): ActivePaymentMethod {
  const configured = process.env.PAYMENT_PROVIDER?.toUpperCase();
  return configured === "LIQPAY" ? "LIQPAY" : "MONOBANK";
}

// Вимикач оплати карткою. За замовчуванням увімкнено; NEXT_PUBLIC_ змінна
// встраивається в клієнтський бандл під час збірки (див. checkout/page.tsx).
export function isOnlinePaymentEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ONLINE_PAYMENT_ENABLED !== "false";
}

export function getPaymentProvider(method: ActivePaymentMethod): PaymentProvider {
  return method === "LIQPAY" ? liqpayProvider : monobankProvider;
}

export type { PaymentCreateResult, PaymentInit, PaymentOrderInput, PaymentWebhookResult } from "./types";
