export const MIN_FILL_MS = 4000;

export type FormGuardInput = {
  honeypot?: string;
  fillMs?: number;
};

export type FormGuardResult =
  | { ok: true }
  | { ok: false; reason: "HONEYPOT" | "TOO_FAST" };

/**
 * Перевіряє поле-ловушку та час заповнення форми.
 * Ловушка перевіряється першою.
 */
export function checkFormGuard({ honeypot, fillMs }: FormGuardInput): FormGuardResult {
  if (honeypot !== undefined && honeypot.trim() !== "") {
    return { ok: false, reason: "HONEYPOT" };
  }

  if (typeof fillMs !== "number" || !(fillMs >= MIN_FILL_MS)) {
    return { ok: false, reason: "TOO_FAST" };
  }

  return { ok: true };
}
