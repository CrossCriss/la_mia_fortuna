import { NextResponse } from "next/server";
import { searchNovaPoshtaCities } from "@/lib/delivery/nova-poshta";

export const dynamic = "force-dynamic";

// GET /api/delivery/nova-poshta/cities?q=Харк — проксі до Nova Poshta API,
// щоб NOVA_POSHTA_API_KEY лишався на сервері й не йшов у клієнтський бандл.
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";

  try {
    const cities = await searchNovaPoshtaCities(query);
    return NextResponse.json(cities);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не вдалося отримати список міст" },
      { status: 502 }
    );
  }
}
