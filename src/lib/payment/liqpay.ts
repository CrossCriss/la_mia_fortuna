import { createHash } from "crypto";
import type { PaymentCreateResult, PaymentOrderInput, PaymentProvider, PaymentWebhookResult } from "./types";

// LiqPay checkout API (https://www.liqpay.ua/documentation/api/aquiring/checkout) —
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

// Статуси, що означають "оплачено" — https://www.liqpay.ua/documentation/api/callback
const PAID_STATUSES = new Set(["success", "sandbox", "subscribed"]);

export function parseLiqpayCallback(data: string, signature: string): PaymentWebhookResult {
  const { privateKey } = getKeys();
  const expectedSignature = sign(privateKey, data);

  if (expectedSignature !== signature) {
    throw new Error("Невірний підпис LiqPay callback");
  }

  const payload = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));

  return {
    orderNumber: payload.order_id,
    invoiceId: payload.order_id,
    isPaid: PAID_STATUSES.has(payload.status),
    rawPayload: payload,
  };
}
