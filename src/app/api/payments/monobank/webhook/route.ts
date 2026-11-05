import { NextResponse } from "next/server";
import { parseMonobankWebhook } from "@/lib/payment/monobank";
import { applyPaymentWebhook } from "@/lib/payment/apply-webhook";

export const dynamic = "force-dynamic";

// POST /api/payments/monobank/webhook — Monobank шле JSON, підпис у
// заголовку X-Sign (ECDSA над сирим тілом). До 3 спроб, поки не отримає 200.
export async function POST(request: Request) {
  const signature = request.headers.get("x-sign");
  const rawBody = Buffer.from(await request.text(), "utf-8");

  if (!signature) {
    return NextResponse.json({ error: "Відсутній X-Sign" }, { status: 400 });
  }

  try {
    const result = await parseMonobankWebhook(rawBody, signature);
    await applyPaymentWebhook(result);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Monobank webhook error:", error);
    return NextResponse.json({ error: "Невірний webhook" }, { status: 400 });
  }
}
