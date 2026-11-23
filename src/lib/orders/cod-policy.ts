// Чиста політика накладеного платежу: без БД і серверних імпортів.

export const COD_MAX_PAIRS = 3;
export const COD_MAX_PENDING_PER_PHONE = 2;
export const COD_WINDOW_MS = 24 * 60 * 60 * 1000;

export type CodDenyReason = "BLOCKED" | "PHONE_LIMIT" | "TOO_MANY_PAIRS";

export type CodDecision =
  | { allowed: true }
  | { allowed: false; reason: CodDenyReason };

export function countPairs(items: { quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function evaluateCod(input: {
  pairs: number;
  pendingCodOrders: number;
  isBlocked: boolean;
}): CodDecision {
  if (input.isBlocked) return { allowed: false, reason: "BLOCKED" };
  if (input.pendingCodOrders >= COD_MAX_PENDING_PER_PHONE) {
    return { allowed: false, reason: "PHONE_LIMIT" };
  }
  if (input.pairs > COD_MAX_PAIRS) {
    return { allowed: false, reason: "TOO_MANY_PAIRS" };
  }
  return { allowed: true };
}
