import { NextResponse } from "next/server";
import { getNovaPoshtaWarehouses } from "@/lib/delivery/nova-poshta";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const NP_LIMIT = 60;
const NP_WINDOW_MS = 60 * 1000; // 1 хвилина

// GET /api/delivery/nova-poshta/warehouses?cityRef=...&q=...
export async function GET(request: Request) {
  const limit = rateLimit(`np:${getClientIp(request)}`, NP_LIMIT, NP_WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Забагато запитів. Спробуйте трохи пізніше." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const params = new URL(request.url).searchParams;
  const cityRef = params.get("cityRef") ?? "";
  const query = params.get("q") ?? undefined;

  if (!cityRef) {
    return NextResponse.json({ error: "cityRef обов'язковий" }, { status: 400 });
  }

  try {
    const warehouses = await getNovaPoshtaWarehouses(cityRef, query);
    return NextResponse.json(warehouses);
  } catch (error) {
    // Справжній текст помилки лише в лог (без ключа API), клієнту - загальний.
    console.error("Nova Poshta warehouses:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Не вдалося отримати дані Нової Пошти" }, { status: 502 });
  }
}
