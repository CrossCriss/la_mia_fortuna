import { createHash, timingSafeEqual } from "crypto";
import type { PaymentCreateResult, PaymentOrderInput, PaymentProvider, PaymentWebhookResult } from "./types";

// LiqPay checkout API (https://www.liqpay.ua/documentation/api/aquiring/checkout) -
// підписаний data+signature пакет, auto-submit форма на liqpay.ua, редірект
// назад на result_url, фактичний статус приходить окремо на server_url (callback).
const LIQPAY_CHECKOUT_URL = "https://www.liqpay.ua/api/3/checkout";

function getKeys() {
  const publicKey = process.env.LIQPAY_PUBLIC_KEY;
  const privateKey = process.env.LIQPAY_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("LIQPAY_PUBLIC_KEY/LIQPAY_PRIVATE_KEY не задані в .env");
  }
  return { publicKey, privateKey };
}

function sign(privateKey: string, data: string) {
  return createHash("sha1").update(privateKey + data + privateKey).digest("base64");
}

export const liqpayProvider: PaymentProvider = {
  async createPayment(order: PaymentOrderInput): Promise<PaymentCreateResult> {
    const { publicKey, privateKey } = getKeys();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const params = {
      version: 3,
      public_key: publicKey,
      action: "pay",
      amount: order.amount,
      currency: "UAH",
      description: order.description,
      order_id: order.orderNumber,
      result_url: `${siteUrl}/thank-you?order=${encodeURIComponent(order.orderNumber)}`,
      server_url: `${siteUrl}/api/payments/liqpay/callback`,
      language: "uk",
    };

    const data = Buffer.from(JSON.stringify(params)).toString("base64");
    const signature = sign(privateKey, data);

    return {
      invoiceId: order.orderNumber,
      init: { kind: "form", url: LIQPAY_CHECKOUT_URL, fields: { data, signature } },
    };
  },
};

// Статуси callback - https://www.liqpay.ua/documentation/api/callback
// sandbox вважається оплатою лише при LIQPAY_SANDBOX=1 (тестовий режим).
function mapLiqpayStatus(status: unknown): PaymentWebhookResult["status"] {
  switch (status) {
    case "success":
      return "PAID";
    case "sandbox":
      return process.env.LIQPAY_SANDBOX === "1" ? "PAID" : "PENDING";
    case "failure":
    case "error":
      return "FAILED";
    case "reversed":
      return "REFUNDED";
    default:
      return "PENDING";
  }
}

function parseAmount(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

export function parseLiqpayCallback(data: string, signature: string): PaymentWebhookResult {
  const { privateKey } = getKeys();
  const expected = Buffer.from(sign(privateKey, data));
  const received = Buffer.from(signature);

  // timingSafeEqual кидає виняток при різній довжині буферів, тому спершу відмова
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw new Error("Невірний підпис LiqPay callback");
  }

  const payload = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));

  return {
    orderNumber: payload.order_id,
    invoiceId: payload.order_id,
    status: mapLiqpayStatus(payload.status),
    amount: parseAmount(payload.amount),
    rawPayload: payload,
  };
}
