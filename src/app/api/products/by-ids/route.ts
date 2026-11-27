import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderByIds, parseIdsParam, toGridProduct } from "@/lib/product-card-data";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

// GET /api/products/by-ids?ids=a,b,c
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = parseIdsParam(searchParams.get("ids"));

  if (ids.length === 0) {
    return NextResponse.json({ products: [] }, { headers: NO_STORE });
  }

  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, isPublished: true },
    include: {
      images: { orderBy: { position: "asc" }, take: 2 },
      variants: { include: { size: true, color: true } },
    },
  });

  const products = orderByIds(rows.map(toGridProduct), ids);
  return NextResponse.json({ products }, { headers: NO_STORE });
}
