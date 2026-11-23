import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeUaPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: { phone: string } }
) {
  const phone = normalizeUaPhone(decodeURIComponent(params.phone));
  if (!phone) {
    return NextResponse.json({ error: "Некоректний номер телефону" }, { status: 400 });
  }

  try {
    await prisma.blockedPhone.delete({ where: { phone } });
  } catch (e) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025")) {
      throw e;
    }
  }
  return NextResponse.json({ ok: true });
}
