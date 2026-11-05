import { NextResponse } from "next/server";
import { parseLiqpayCallback } from "@/lib/payment/liqpay";
import { applyPaymentWebhook } from "@/lib/payment/apply-webhook";

export const dynamic = "force-dynamic";

// POST /api/payments/liqpay/callback — server_url, LiqPay шле
// application/x-www-form-urlencoded з полями data+signature.
export async function POST(request: Request) {
  const form = await request.formData();
  const data = form.get("data");
  const signature = form.get("signature");

  if (typeof data !== "string" || typeof signature !== "string") {
    return NextResponse.json({ error: "Відсутні data/signature" }, { status: 400 });
  }

  try {
    const result = parseLiqpayCallback(data, signature);
    await applyPaymentWebhook(result);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("LiqPay callback error:", error);
    return NextResponse.json({ error: "Невірний callback" }, { status: 400 });
  }
}
