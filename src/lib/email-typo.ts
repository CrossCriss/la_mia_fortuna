// Підказка при опечатці в домені email. Лише клієнтська порада, замовлення не блокує.
const POPULAR_DOMAINS = [
  "gmail.com",
  "ukr.net",
  "i.ua",
  "meta.ua",
  "icloud.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "proton.me",
  "bigmir.net",
];

// Справжні домени, для яких підказку не показуємо (щоб не зіпсувати вірну адресу).
const KNOWN_REAL_DOMAINS = [
  "mail.com",
  "ymail.com",
  "email.com",
  "gmx.com",
  "gmx.net",
  "live.com",
  "me.com",
  "mac.com",
  "msn.com",
  "aol.com",
  "mail.ua",
  "yandex.ru",
  "yandex.ua",
  "rambler.ru",
  "inbox.ru",
  "list.ru",
  "bk.ru",
  "mail.ru",
  "protonmail.com",
  "pm.me",
  "tutanota.com",
  "zoho.com",
  "gmail.com.ua",
];

function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

export function suggestEmailFix(email: string): string | null {
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf("@");
  if (at < 1) return null;
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1).toLowerCase();
  if (domain.length < 5 || POPULAR_DOMAINS.includes(domain) || KNOWN_REAL_DOMAINS.includes(domain)) return null;

  let best: string | null = null;
  let bestDist = 3;
  for (const candidate of POPULAR_DOMAINS) {
    const d = levenshtein(domain, candidate);
    if (d <= 2 && d < bestDist) {
      best = candidate;
      bestDist = d;
    }
  }
  return best ? `${local}@${best}` : null;
}
