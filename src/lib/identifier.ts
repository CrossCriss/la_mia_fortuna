import { isValidPhoneInput, normalizePhoneToE164 } from "@/lib/phone";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ParsedIdentifier =
  | { type: "phone"; value: string }
  | { type: "email"; value: string }
  | { type: "invalid" };

// Єдине поле "телефон або email" на вході логіну/реєстрації — визначаємо, чим
// саме є значення, і нормалізуємо його до форми, в якій воно лежить у User.
export function parseIdentifier(raw: string): ParsedIdentifier {
  const trimmed = raw.trim();
  if (isValidPhoneInput(trimmed)) {
    return { type: "phone", value: normalizePhoneToE164(trimmed) };
  }
  if (EMAIL_REGEX.test(trimmed)) {
    return { type: "email", value: trimmed.toLowerCase() };
  }
  return { type: "invalid" };
}
