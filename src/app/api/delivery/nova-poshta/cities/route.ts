import { NextResponse } from "next/server";
import { searchNovaPoshtaCities } from "@/lib/delivery/nova-poshta";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const NP_LIMIT = 60;
const NP_WINDOW_MS = 60 * 1000; // 1 хвилина

// GET /api/delivery/nova-poshta/cities?q=Харк - проксі до Nova Poshta API,
// щоб NOVA_POSHTA_API_KEY лишався на сервері й не йшов у клієнтський бандл.
export async function GET(request: Request) {
  const limit = rateLimit(`np:${getClientIp(request)}`, NP_LIMIT, NP_WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Забагато запитів. Спробуйте трохи пізніше." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const query = new URL(request.url).searchParams.get("q") ?? "";

  try {
    const cities = await searchNovaPoshtaCities(query);
    return NextResponse.json(cities);
  } catch (error) {
    // Справжній текст помилки лише в лог (без ключа API), клієнту - загальний.
    console.error("Nova Poshta cities:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Не вдалося отримати дані Нової Пошти" }, { status: 502 });
  }
}
