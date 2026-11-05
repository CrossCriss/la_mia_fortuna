// Навмисно без Intl.NumberFormat: символ валюти для UAH у style:"currency"
// резолвиться через ICU/CLDR-дані рантайму, а вони відрізняються між Node.js
// (сервер, SSR) і браузером (клієнт) — саме це давало hydration mismatch
// ("0 ₴" на сервері проти "0 грн" на клієнті) навіть при явно заданих
// locale/currency. Простий рядковий шаблон дає гарантовано однаковий
// результат на сервері й клієнті, незалежно від версії ICU.
const CURRENCY_SUFFIX = "₴";

export function formatPrice(value: number | string): string {
  const amount = typeof value === "string" ? Number(value) : value;
  const rounded = Math.round(amount * 100) / 100;
  const [integerPart, decimalPart] = rounded.toFixed(2).split(".");
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const hasCents = decimalPart !== "00";
  const formatted = hasCents ? `${groupedInteger},${decimalPart}` : groupedInteger;
  return `${formatted} ${CURRENCY_SUFFIX}`;
}
