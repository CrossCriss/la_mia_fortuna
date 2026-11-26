import { promises as dns } from "dns";

// Серверна перевірка, що домен email існує і приймає пошту. Ніколи не кидає:
// збій DNS не повинен губити продажі (результат "unavailable").
export type EmailDomainResult = "ok" | "invalid" | "unavailable";

export interface EmailResolver {
  resolveMx(domain: string): Promise<unknown[]>;
  resolve4(domain: string): Promise<unknown[]>;
  resolve6(domain: string): Promise<unknown[]>;
}

const DEFAULT_TIMEOUT_MS = 2500;
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 500;

const cache = new Map<string, { result: EmailDomainResult; expires: number }>();

export function clearEmailDomainCache(): void {
  cache.clear();
}

function errCode(error: unknown): string {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : "";
}

type Lookup = "found" | "none" | "unavailable";

async function lookup(fn: () => Promise<unknown[]>): Promise<Lookup> {
  try {
    const records = await fn();
    return records.length > 0 ? "found" : "none";
  } catch (error) {
    const code = errCode(error);
    return code === "ENOTFOUND" || code === "ENODATA" ? "none" : "unavailable";
  }
}

async function resolveDomain(domain: string, resolver: EmailResolver): Promise<EmailDomainResult> {
  const mx = await lookup(() => resolver.resolveMx(domain));
  if (mx === "found") return "ok";
  if (mx === "unavailable") return "unavailable";
  // MX немає: за RFC пошту приймає і A/AAAA-запис.
  const [a, aaaa] = await Promise.all([
    lookup(() => resolver.resolve4(domain)),
    lookup(() => resolver.resolve6(domain)),
  ]);
  if (a === "found" || aaaa === "found") return "ok";
  if (a === "unavailable" || aaaa === "unavailable") return "unavailable";
  return "invalid";
}

export async function checkEmailDomain(
  email: string,
  options: { timeoutMs?: number; resolver?: EmailResolver } = {},
): Promise<EmailDomainResult> {
  try {
    const at = email.lastIndexOf("@");
    const domain = at >= 0 ? email.slice(at + 1).trim().toLowerCase().replace(/\.$/, "") : "";
    if (!domain) return "invalid";

    const cached = cache.get(domain);
    if (cached && cached.expires > Date.now()) return cached.result;

    const resolver = options.resolver ?? (dns as unknown as EmailResolver);
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<EmailDomainResult>((resolve) => {
      timer = setTimeout(() => resolve("unavailable"), timeoutMs);
    });
    const result = await Promise.race([resolveDomain(domain, resolver), timeout]).finally(() =>
      clearTimeout(timer),
    );

    // Тимчасові збої не кешуємо.
    if (result !== "unavailable") {
      if (cache.size >= CACHE_MAX) {
        const oldest = cache.keys().next().value;
        if (oldest !== undefined) cache.delete(oldest);
      }
      cache.set(domain, { result, expires: Date.now() + CACHE_TTL_MS });
    }
    return result;
  } catch {
    return "unavailable";
  }
}
