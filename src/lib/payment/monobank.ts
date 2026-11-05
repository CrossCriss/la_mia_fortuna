import { createPublicKey, verify as cryptoVerify } from "crypto";
import type { PaymentCreateResult, PaymentOrderInput, PaymentProvider, PaymentWebhookResult } from "./types";

// Monobank Acquiring API (https://api.monobank.ua/docs/acquiring.html).
const MONOBANK_API_URL = "https://api.monobank.ua/api/merchant";

function getToken() {
  const token = process.env.MONOBANK_TOKEN;
  if (!token) {
    throw new Error("MONOBANK_TOKEN не задано — особистий кабінет Monobank для бізнесу → Plata by mono → API");
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
// його на кожен вебхук) і перезапитується, якщо перевірка підпису не пройшла —
// Monobank інколи ротує ключ.
let cachedPublicKeyBase64: string | null = null;

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
};

export async function parseMonobankWebhook(
  rawBody: Buffer,
  signatureBase64: string
): Promise<PaymentWebhookResult> {
  const isValid = await verifySignature(rawBody, signatureBase64);
  if (!isValid) {
    throw new Error("Невірний підпис Monobank webhook (X-Sign)");
  }

  const payload: MonobankWebhookPayload = JSON.parse(rawBody.toString("utf-8"));

  return {
    orderNumber: payload.reference ?? "",
    invoiceId: payload.invoiceId,
    isPaid: payload.status === "success",
    rawPayload: payload,
  };
}
