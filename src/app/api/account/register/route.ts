import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { parseIdentifier } from "@/lib/identifier";

export const dynamic = "force-dynamic";

// Реєстрація лише створює User — вхід після цього клієнт виконує окремим
// signIn("credentials", …) з next-auth/react, щоб не дублювати логіку сесій.
const registerSchema = z
  .object({
    identifier: z.string().trim().min(1, "Вкажіть телефон або email"),
    password: z.string().min(6, "Пароль має містити щонайменше 6 символів"),
    confirmPassword: z.string(),
    name: z.string().trim().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Паролі не збігаються",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некоректні дані", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const identifier = parseIdentifier(parsed.data.identifier);
  if (identifier.type === "invalid") {
    return NextResponse.json(
      { error: "Вкажіть коректний телефон (+38 (0XX) XXX-XX-XX) або email" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where:
      identifier.type === "phone" ? { phone: identifier.value } : { email: identifier.value },
  });
  if (existing) {
    return NextResponse.json(
      {
        error:
          identifier.type === "phone" ? "Цей телефон вже зареєстровано" : "Цей email вже зареєстровано",
      },
      { status: 409 }
    );
  }

  const identifierData = identifier.type === "phone" ? { phone: identifier.value } : { email: identifier.value };

  const user = await prisma.user.create({
    data: {
      ...identifierData,
      passwordHash: hashPassword(parsed.data.password),
      name: parsed.data.name || undefined,
    },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
