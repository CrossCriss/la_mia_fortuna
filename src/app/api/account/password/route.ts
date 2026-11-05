import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

const passwordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, "Пароль має містити щонайменше 6 символів"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Паролі не збігаються",
    path: ["confirmNewPassword"],
  });

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = passwordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некоректні дані", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "Користувача не знайдено" }, { status: 404 });
  }

  // Акаунт, створений через Google, може не мати пароля — тоді старий не перевіряємо.
  if (user.passwordHash) {
    if (
      !parsed.data.currentPassword ||
      !verifyPassword(parsed.data.currentPassword, user.passwordHash)
    ) {
      return NextResponse.json({ error: "Поточний пароль невірний" }, { status: 400 });
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: hashPassword(parsed.data.newPassword) },
  });

  return NextResponse.json({ ok: true });
}
