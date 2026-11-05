// Підпис сесійного токена через Web Crypto (crypto.subtle) — навмисно без
// Node-специфічних API (Buffer, node:crypto), бо цей модуль підключається
// і з middleware, який виконується на Edge runtime.
//
// Токен має формат `<base64url(payload-json)>.<base64url(hmac-signature)>`.
// Payload кодується в base64url одним шматком (без крапок всередині), тому
// що email може містити крапки (напр. "admin@la-mia-fortuna.local") — розбір
// токена по "." з фіксованою кількістю частин на цьому й ламався.
export const ADMIN_SESSION_COOKIE = "admin_session";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function stringToBase64Url(value: string): string {
  return bufferToBase64Url(encoder.encode(value).buffer);
}

function base64UrlToString(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return decoder.decode(bytes);
}

async function getKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

export async function createSessionToken(
  email: string,
  secret: string,
  maxAgeMs: number
): Promise<string> {
  const expires = Date.now() + maxAgeMs;
  const payloadB64 = stringToBase64Url(JSON.stringify({ email, expires }));
  const key = await getKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  return `${payloadB64}.${bufferToBase64Url(signature)}`;
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string
): Promise<string | null> {
  if (!token) return null;

  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const payloadB64 = token.slice(0, dotIndex);
  const signatureB64 = token.slice(dotIndex + 1);

  const key = await getKey(secret);
  const expectedSignature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  const expectedB64 = bufferToBase64Url(expectedSignature);

  if (expectedB64.length !== signatureB64.length) return null;
  let mismatch = 0;
  for (let i = 0; i < expectedB64.length; i++) {
    mismatch |= expectedB64.charCodeAt(i) ^ signatureB64.charCodeAt(i);
  }
  if (mismatch !== 0) return null;

  try {
    const payload = JSON.parse(base64UrlToString(payloadB64));
    if (typeof payload.email !== "string" || typeof payload.expires !== "number") return null;
    if (Date.now() > payload.expires) return null;
    return payload.email;
  } catch {
    return null;
  }
}
