import { NextResponse } from "next/server";
import { getNovaPoshtaWarehouses } from "@/lib/delivery/nova-poshta";

export const dynamic = "force-dynamic";

// GET /api/delivery/nova-poshta/warehouses?cityRef=...&q=...
export async function GET(request: Request) {
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не вдалося отримати список відділень" },
      { status: 502 }
    );
  }
}
