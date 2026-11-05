// Український мобільний номер у форматі +38 (0XX) XXX-XX-XX — реєстрація/профіль
// кабінету клієнта (окремо від looser-формату, який приймає чекаут).
//
// Канонічна внутрішня форма — "значущі цифри": до 9 цифр номера БЕЗ коду країни
// (380) і БЕЗ ведучого 0 (той завжди статичний літерал "+38 (0" в масці).
// Усе інше (extractSignificantDigits, buildPhoneMask, normalizePhoneToE164,
// computeMaskedPhoneEdit) працює виключно через цю форму, тому маска й валідація
// органічно не можуть розійтись.

const SIGNIFICANT_DIGITS = 9;

// Статичні символи маски, що йдуть одразу ПІСЛЯ відповідної (0-indexed) значущої
// цифри: "+38 (0XX) XXX-XX-XX" → після 2-ї цифри ") ", після 5-ї "-", після 7-ї "-".
const SUFFIX_AFTER_DIGIT: Record<number, string> = { 1: ") ", 4: "-", 6: "-" };

// З довільного рядка лишає ТІЛЬКИ цифри — решта (літери, дужки, пробіли, "="
// тощо) відкидається беззастережно, незалежно від того, що ввів користувач.
function extractDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

// Ведучі "380" або "0" — це код країни/статичний нуль маски, не значуща частина
// номера, тому їх завжди відрізаємо (максимум одне з двох, з початку рядка).
function stripKnownPrefix(digits: string): string {
  if (digits.startsWith("380")) return digits.slice(3);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

function extractSignificantDigits(raw: string): string {
  return stripKnownPrefix(extractDigits(raw)).slice(0, SIGNIFICANT_DIGITS);
}

// Будує рядок маски "з нуля" з чистих значущих цифр і для кожної запам'ятовує
// позицію в результуючому рядку одразу ПІСЛЯ цієї цифри — потрібно для
// коректного відновлення курсора в computeMaskedPhoneEdit.
function buildPhoneMask(digits: string): { value: string; digitEndPositions: number[] } {
  if (digits.length === 0) return { value: "", digitEndPositions: [] };

  let value = "+38 (0";
  const digitEndPositions: number[] = [];

  for (let i = 0; i < digits.length; i++) {
    value += digits[i];
    digitEndPositions.push(value.length);
    value += SUFFIX_AFTER_DIGIT[i] ?? "";
  }

  return { value: value.trimEnd(), digitEndPositions };
}

// Одноразове форматування (без курсора) — для початкового значення поля
// (formatE164ForDisplay) чи будь-якого місця, де контрольований інпут не потрібен.
export function formatPhoneInput(raw: string): string {
  return buildPhoneMask(extractSignificantDigits(raw)).value;
}

export function isValidPhoneInput(value: string): boolean {
  return /^\+38 \(0\d{2}\) \d{3}-\d{2}-\d{2}$/.test(value.trim());
}

// +38 (0XX) XXX-XX-XX (чи будь-який ввід з цифрами) → +380XXXXXXXXX.
export function normalizePhoneToE164(value: string): string {
  return `+380${extractSignificantDigits(value)}`;
}

// +380XXXXXXXXX → +38 (0XX) XXX-XX-XX (для показу в формі редагування).
export function formatE164ForDisplay(value: string): string {
  return formatPhoneInput(value);
}

// Рядок вважається "телефоном у процесі набору" лише якщо складається
// ВИКЛЮЧНО з цифр і символів самої маски (пробіл, дужки, +, -) — жодних літер
// чи "@". Використовується для розрізнення телефон/email у полі, що приймає
// обидва варіанти (перевіряється на СИРОМУ вводі, до будь-якого маскування).
export function looksLikePhoneRaw(raw: string): boolean {
  return /^[\d\s()+-]*$/.test(raw);
}

// Основна функція контрольованого інпута з маскою: приймає сирий рядок ПІСЛЯ
// того, як браузер уже застосував редагування користувача (звичайний ввід,
// paste, будь-який Backspace/Delete — байдуже, що саме сталось) і позицію
// курсора в цьому рядку, і повертає:
//  - value: рядок маски, повністю перебудований з нуля з чистих цифр;
//  - cursorPos: позицію курсора в НОВОМУ рядку, розраховану так, щоб курсор
//    залишався одразу після тієї ж за порядком значущої цифри, що й до правки.
// Це унеможливлює появу в value будь-чого, крім цифр і літералів самої маски,
// і не залежить від того, який саме символ фізично видалив/додав браузер.
export function computeMaskedPhoneEdit(
  rawValue: string,
  cursorPos: number
): { value: string; cursorPos: number } {
  const allDigits = extractDigits(rawValue);
  const digitsBeforeCursorRaw = extractDigits(rawValue.slice(0, cursorPos)).length;

  const prefixLen = allDigits.startsWith("380") ? 3 : allDigits.startsWith("0") ? 1 : 0;
  const significantDigits = allDigits.slice(prefixLen, prefixLen + SIGNIFICANT_DIGITS);
  const significantDigitsBeforeCursor = Math.max(
    0,
    Math.min(digitsBeforeCursorRaw - prefixLen, significantDigits.length)
  );

  const { value, digitEndPositions } = buildPhoneMask(significantDigits);

  const newCursorPos =
    significantDigitsBeforeCursor === 0
      ? value.length > 0
        ? "+38 (0".length
        : 0
      : digitEndPositions[significantDigitsBeforeCursor - 1];

  return { value, cursorPos: newCursorPos };
}
