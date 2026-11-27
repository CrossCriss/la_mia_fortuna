import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-session";
import { buildOrdersCsv } from "@/lib/admin/orders-csv";

export const dynamic = "force-dynamic";

const STATUS_VALUES = ["NEW", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELED"];

export async function GET(request: NextRequest) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const email = secret ? await verifySessionToken(token, secret) : null;
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = request.nextUrl.searchParams.get("status");
  const status = raw && STATUS_VALUES.includes(raw) ? raw : undefined;

  const orders = await prisma.order.findMany({
    where: status ? { status: status as any } : undefined,
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const csv = buildOrdersCsv(orders as any);
  // Дата за Києвом у форматі РРРР-ММ-ДД (en-CA дає саме такий вигляд)
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const filename = `orders-${date}${status ? `-${status.toLowerCase()}` : ""}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
