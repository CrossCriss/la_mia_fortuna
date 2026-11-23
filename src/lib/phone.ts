// Нормализация и проверка украинского мобильного номера.
// Модуль чистый: без импортов из сервера и БД, используется и в браузере.

// Коды операторов без ведущего 0. Если появится новый код, дополнять список здесь.
export const UA_MOBILE_CODES = [
  "39",
  "50",
  "63",
  "66",
  "67",
  "68",
  "73",
  "75",
  "77",
  "91",
  "92",
  "93",
  "94",
  "95",
  "96",
  "97",
  "98",
  "99",
] as const;

/** Любой вариант записи -> `380XXXXXXXXX`, либо null, если номер не украинский мобильный. */
export function normalizeUaPhone(input: string): string | null {
  const cleaned = input.replace(/[\s\-().]/g, "");
  let national: string; // 9 цифр после ведущего 0
  let m: RegExpMatchArray | null;
  if ((m = cleaned.match(/^\+380(\d{9})$/))) national = m[1];
  else if ((m = cleaned.match(/^380(\d{9})$/))) national = m[1];
  else if ((m = cleaned.match(/^80(\d{9})$/))) national = m[1];
  else if ((m = cleaned.match(/^0(\d{9})$/))) national = m[1];
  else return null;

  const code = national.slice(0, 2);
  if (!(UA_MOBILE_CODES as readonly string[]).includes(code)) return null;
  return `380${national}`;
}

/** Варианты записи для поиска старых заказов, где номер сохранен как ввел покупатель. */
export function phoneLookupVariants(normalized: string): string[] {
  return [normalized, `+${normalized}`, `0${normalized.slice(3)}`];
}

/** `380501234567` -> `+380 50 123 45 67` (для показа в админке). */
export function formatUaPhone(normalized: string): string {
  const d = normalized;
  return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`;
}
