const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const DEFAULT_TIMEOUT_MS = 4000;

export type TurnstileResult = "ok" | "failed" | "unavailable" | "disabled";

export function isTurnstileEnabled(): boolean {
  const key = process.env.TURNSTILE_SECRET_KEY;
  return typeof key === "string" && key.trim().length > 0;
}

export async function verifyTurnstileToken(
  token: string | undefined,
  remoteIp: string | null,
  options?: { timeoutMs?: number },
): Promise<TurnstileResult> {
  if (!isTurnstileEnabled()) return "disabled";
  if (!token || token.trim() === "") return "failed";

  const secret = (process.env.TURNSTILE_SECRET_KEY as string).trim();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body,
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`Turnstile: siteverify HTTP ${res.status}`);
      return "unavailable";
    }
    const data = (await res.json()) as { success?: unknown };
    return data && data.success === true ? "ok" : "failed";
  } catch (err) {
    const name = err instanceof Error ? err.name : "unknown";
    console.error(`Turnstile: siteverify unavailable (${name})`);
    return "unavailable";
  } finally {
    clearTimeout(timer);
  }
}
