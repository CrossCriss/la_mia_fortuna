import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Node-only (scrypt) — використовується в API-роутах логіну/реєстрації (адмінка й кабінет
// клієнта) та в seed-скрипті, НЕ в middleware (той працює на Edge runtime, де немає Node crypto).
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;

  const derivedKey = scryptSync(password, salt, KEY_LENGTH);
  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== derivedKey.length) return false;

  return timingSafeEqual(derivedKey, keyBuffer);
}
