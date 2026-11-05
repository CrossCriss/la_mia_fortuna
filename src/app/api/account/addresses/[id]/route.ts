import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const updateAddressSchema = z.object({
  recipientName: z.string().trim().min(2, "Вкажіть ім'я та прізвище"),
  phone: z.string().trim().min(5, "Вкажіть телефон"),
  city: z.string().trim().min(2, "Вкажіть місто"),
  warehouse: z.string().trim().min(1, "Вкажіть відділення Нової Пошти"),
});

async function assertOwnership(addressId: string, userId: string) {
  const address = await prisma.savedAddress.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) return null;
  return address;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const owned = await assertOwnership(params.id, session.user.id);
  if (!owned) {
    return NextResponse.json({ error: "Адресу не знайдено" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateAddressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некоректні дані", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const address = await prisma.savedAddress.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json(address);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const owned = await assertOwnership(params.id, session.user.id);
  if (!owned) {
    return NextResponse.json({ error: "Адресу не знайдено" }, { status: 404 });
  }

  await prisma.savedAddress.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
