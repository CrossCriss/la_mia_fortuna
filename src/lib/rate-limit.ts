// Обмеження частоти запитів (rate limit) для чутливих API-роутів.
//
// ВАЖЛИВО, обмеження: лічильник зберігається в пам'яті одного процесу.
// На Vercel кожен екземпляр serverless-функції має власний лічильник, він
// скидається при холодному старті й не ділиться між екземплярами. Тому це
// лише додатковий захист, а основний захист від перебору пароля та спаму -
// правило Rate Limiting у Vercel Firewall.

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

// Фіксоване вікно: перший запит ключа відкриває вікно на windowMs, усі запити
// в межах вікна рахуються, після закінчення вікно починається заново.
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): RateLimitResult {
  // Очищення прострочених записів при кожному зверненні, щоб Map не росла.
  for (const [entryKey, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(entryKey);
    }
  }

  const current = store.get(key);
  if (!current) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

// IP клієнта: перше значення x-forwarded-for (за ним стоїть проксі Vercel),
// інакше "unknown".
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first ? first : "unknown";
}

// Лише для тестів: повне очищення лічильників.
export function resetRateLimitStore(): void {
  store.clear();
}
