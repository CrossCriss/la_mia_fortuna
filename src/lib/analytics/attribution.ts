// Захоплення UTM-міток і джерела переходу: запам'ятовуємо, з якої реклами
// прийшов покупець, щоб потім прив'язати це до замовлення.

export const ATTRIBUTION_STORAGE_KEY = "lmf-attribution";

const MAX_VALUE_LENGTH = 200;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const TEXT_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "landing",
  "referrer",
] as const;

type TextKey = (typeof TEXT_KEYS)[number];

export type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  landing?: string;
  referrer?: string;
  capturedAt: string;
};

const SEARCH_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
] as const;

function clip(value: string): string {
  return value.slice(0, MAX_VALUE_LENGTH);
}

// Повертає лише хост реферера; невалідний або порожній реферер дає "".
function getReferrerHost(referrer: string): string {
  if (!referrer) return "";
  try {
    return new URL(referrer).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith("." + domain);
}

// Визначає соцмережу за хостом реферера. Порівняння строге, щоб
// fakeinstagram.com або instagram.evil.com не вважалися Instagram.
function getReferrerSource(host: string): "instagram" | "facebook" | null {
  if (hostMatches(host, "instagram.com")) return "instagram";
  if (
    hostMatches(host, "facebook.com") ||
    hostMatches(host, "fb.com")
  ) {
    return "facebook";
  }
  return null;
}

export function parseAttribution(
  search: string,
  referrer: string,
  pathname: string,
  now: Date,
): Attribution | null {
  const params = new URLSearchParams(search);
  const result: Attribution = { capturedAt: now.toISOString() };
  let hasMarks = false;

  for (const key of SEARCH_KEYS) {
    const value = (params.get(key) ?? "").trim();
    if (value) {
      result[key] = clip(value);
      hasMarks = true;
    }
  }

  const host = getReferrerHost(referrer);

  if (!hasMarks) {
    const source = getReferrerSource(host);
    if (!source) return null;
    result.utm_source = source;
    result.utm_medium = "referral";
  }

  if (pathname) result.landing = clip(pathname);
  if (host) result.referrer = clip(host);

  return result;
}

// Атрибуція, отримана лише з реферера (без жодних справжніх міток).
function isReferrerOnly(a: Attribution): boolean {
  return (
    a.utm_medium === "referral" &&
    !a.fbclid &&
    !a.utm_campaign &&
    !a.utm_content &&
    !a.utm_term
  );
}

// Справжні рекламні мітки: fbclid, кампанія, контент, термін
// або medium, відмінний від "referral".
function hasRealMarks(a: Attribution): boolean {
  return Boolean(
    a.fbclid ||
      a.utm_campaign ||
      a.utm_content ||
      a.utm_term ||
      (a.utm_medium && a.utm_medium !== "referral"),
  );
}

function isFresh(a: Attribution, now: Date): boolean {
  const capturedMs = Date.parse(a.capturedAt);
  if (Number.isNaN(capturedMs)) return false;
  return now.getTime() - capturedMs < MAX_AGE_MS;
}

export function mergeAttribution(
  existing: Attribution | null,
  incoming: Attribution | null,
  now: Date,
): Attribution | null {
  if (incoming) {
    // Перехід з соцмережі без міток не має затирати свіжі платні мітки
    if (
      existing &&
      isReferrerOnly(incoming) &&
      hasRealMarks(existing) &&
      isFresh(existing, now)
    ) {
      return existing;
    }
    return incoming;
  }
  if (!existing) return null;
  return isFresh(existing, now) ? existing : null;
}

export function readAttribution(): Attribution | null {
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    const data = parsed as Record<string, unknown>;
    if (typeof data.capturedAt !== "string") return null;

    // Вміст localStorage не довіряємо: беремо лише відомі ключі й рядкові значення.
    const result: Attribution = { capturedAt: clip(data.capturedAt) };
    for (const key of TEXT_KEYS) {
      const value = data[key];
      if (typeof value === "string" && value) {
        result[key as TextKey] = clip(value);
      }
    }
    return result;
  } catch {
    return null;
  }
}

export function writeAttribution(value: Attribution | null): void {
  try {
    if (value === null) {
      window.localStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
    } else {
      window.localStorage.setItem(
        ATTRIBUTION_STORAGE_KEY,
        JSON.stringify(value),
      );
    }
  } catch {
    // Сховище може бути недоступне (приватний режим, сервер): це не помилка
  }
}
