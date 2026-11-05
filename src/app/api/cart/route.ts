import { NextResponse } from "next/server";

// Корзина ведётся на клиенте (zustand + localStorage, см. src/lib/cart-store.ts).
// Этот роут — заготовка на случай серверной валидации остатков перед чекаутом.
export async function POST() {
  return NextResponse.json({ ok: true });
}
