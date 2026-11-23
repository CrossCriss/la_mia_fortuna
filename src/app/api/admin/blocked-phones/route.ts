import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeUaPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  phone: z.string(),
  reason: z.string().trim().max(200).optional(),
});

export async function GET() {
  const rows = await prisma.blockedPhone.findMany({
    select: { phone: true, reason: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некоректні дані" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некоректні дані" }, { status: 400 });
  }

  const phone = normalizeUaPhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json({ error: "Некоректний номер телефону" }, { status: 400 });
  }

  const reason = parsed.data.reason || null;
  const row = await prisma.blockedPhone.upsert({
    where: { phone },
    create: { phone, reason },
    update: { reason },
    select: { phone: true, reason: true },
  });
  return NextResponse.json(row, { status: 201 });
}
