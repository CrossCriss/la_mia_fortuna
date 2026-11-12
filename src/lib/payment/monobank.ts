import { createPublicKey, verify as cryptoVerify } from "crypto";
import type { PaymentCreateResult, PaymentOrderInput, PaymentProvider, PaymentWebhookResult } from "./types";

// Monobank Acquiring API (https://api.monobank.ua/docs/acquiring.html).
const MONOBANK_API_URL = "https://api.monobank.ua/api/merchant";

function getToken() {
  const token = process.env.MONOBANK_TOKEN;
  if (!token) {
    throw new Error("MONOBANK_TOKEN не задано - особистий кабінет Monobank для бізнесу → Plata by mono → API");
  }
  return token;
}

export const monobankProvider: PaymentProvider = {
  async createPayment(order: PaymentOrderInput): Promise<PaymentCreateResult> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const response = await fetch(`${MONOBANK_API_URL}/invoice/create`, {
      method: "POST",
      headers: { "X-Token": getToken(), "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Math.round(order.amount * 100), // копійки
        ccy: 980,
        merchantPaymInfo: {
          reference: order.orderNumber,
          destination: order.description,
        },
        redirectUrl: `${siteUrl}/thank-you?order=${encodeURIComponent(order.orderNumber)}`,
        webHookUrl: `${siteUrl}/api/payments/monobank/webhook`,
        validity: 3600,
      }),
    });

    if (!response.ok) {
      throw new Error(`Monobank invoice/create HTTP ${response.status}: ${await response.text()}`);
    }

    const result: { invoiceId: string; pageUrl: string } = await response.json();

    return {
      invoiceId: result.invoiceId,
      init: { kind: "redirect", url: result.pageUrl },
    };
  },
};

// Публічний ключ кешується в пам'яті процесу (докум. радить не запитувати
// його на кожен вебхук) і перезапитується, якщо перевірка підпису не пройшла -
// Monobank інколи ротує ключ.
let cachedPublicKeyBase64: string | null = null;

// Лише для тестів: скидає кеш публічного ключа між кейсами.
export function __resetMonobankKeyCacheForTests() {
  cachedPublicKeyBase64 = null;
}

async function fetchPublicKey(): Promise<string> {
  const response = await fetch(`${MONOBANK_API_URL}/pubkey`, {
    headers: { "X-Token": getToken() },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Monobank pubkey HTTP ${response.status}`);
  }
  const { key } = await response.json();
  return key;
}

async function verifySignature(rawBody: Buffer, signatureBase64: string): Promise<boolean> {
  for (const forceRefresh of [false, true]) {
    if (forceRefresh || !cachedPublicKeyBase64) {
      cachedPublicKeyBase64 = await fetchPublicKey();
    }

    const publicKey = createPublicKey({
      key: Buffer.from(cachedPublicKeyBase64, "base64"),
      format: "der",
      type: "spki",
    });

    const isValid = cryptoVerify("SHA256", rawBody, publicKey, Buffer.from(signatureBase64, "base64"));
    if (isValid) return true;
  }
  return false;
}

type MonobankWebhookPayload = {
  invoiceId: string;
  status: "created" | "processing" | "hold" | "success" | "failure" | "reversed" | "expired";
  reference?: string;
  amount?: number; // копійки
};

function mapMonobankStatus(status: string): PaymentWebhookResult["status"] {
  switch (status) {
    case "success":
      return "PAID";
    case "failure":
    case "expired":
      return "FAILED";
    case "reversed":
      return "REFUNDED";
    default:
      return "PENDING";
  }
}

function toWebhookResult(payload: MonobankWebhookPayload): PaymentWebhookResult {
  return {
    orderNumber: payload.reference ?? "",
    invoiceId: payload.invoiceId,
    status: mapMonobankStatus(payload.status),
    amount: typeof payload.amount === "number" ? payload.amount / 100 : null,
    rawPayload: payload,
  };
}

export async function parseMonobankWebhook(
  rawBody: Buffer,
  signatureBase64: string
): Promise<PaymentWebhookResult> {
  const isValid = await verifySignature(rawBody, signatureBase64);
  if (!isValid) {
    throw new Error("Невірний підпис Monobank webhook (X-Sign)");
  }

  const payload: MonobankWebhookPayload = JSON.parse(rawBody.toString("utf-8"));

  return toWebhookResult(payload);
}

// Запит поточного статусу рахунку (для звірки, якщо вебхук не дійшов).
// Не-2xx відповідь кидає помилку - її ловить викликач.
export async function getMonobankInvoiceStatus(invoiceId: string): Promise<PaymentWebhookResult> {
  const response = await fetch(
    `${MONOBANK_API_URL}/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`,
    {
      headers: { "X-Token": getToken() },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    }
  );
  if (!response.ok) {
    throw new Error(`Monobank invoice/status HTTP ${response.status}`);
  }

  const payload: MonobankWebhookPayload = await response.json();
  return toWebhookResult({ ...payload, invoiceId: payload.invoiceId ?? invoiceId });
}
