import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { ADMIN_SESSION_COOKIE, createSessionToken } from "@/lib/admin-session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 днів

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Вкажіть email і пароль" }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });

  if (!admin || !admin.isActive || !verifyPassword(password, admin.passwordHash)) {
    return NextResponse.json({ error: "Невірний email або пароль" }, { status: 401 });
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Сервер не налаштовано: відсутній ADMIN_SESSION_SECRET" },
      { status: 500 }
    );
  }

  const token = await createSessionToken(admin.email, secret, SESSION_MAX_AGE_SECONDS * 1000);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
