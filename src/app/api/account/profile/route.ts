import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidPhoneInput, normalizePhoneToE164 } from "@/lib/phone";

export const dynamic = "force-dynamic";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Вкажіть ім'я").optional().or(z.literal("")),
  email: z.string().trim().email("Некоректний email").optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || isValidPhoneInput(value), {
      message: "Телефон у форматі +38 (0XX) XXX-XX-XX",
    })
    .optional(),
});

// Використовується чекаутом для автозаповнення імені/телефону/email залогіненого
// клієнта — окреме джерело від SavedAddress (та відповідає лише за місто/відділення).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "Користувача не знайдено" }, { status: 404 });
  }

  return NextResponse.json({ name: user.name, email: user.email, phone: user.phone });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некоректні дані", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const email = parsed.data.email ? parsed.data.email.toLowerCase() : undefined;
  const phone = parsed.data.phone ? normalizePhoneToE164(parsed.data.phone) : undefined;

  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: "Цей email вже використовується" }, { status: 409 });
    }
  }
  if (phone) {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: "Цей телефон вже використовується" }, { status: 409 });
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name || undefined,
      email,
      phone,
    },
  });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email, phone: user.phone });
}
