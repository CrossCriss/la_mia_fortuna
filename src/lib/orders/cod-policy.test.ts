import { describe, expect, it } from "vitest";
import {
  COD_MAX_PAIRS,
  COD_MAX_PENDING_PER_PHONE,
  COD_WINDOW_MS,
  countPairs,
  evaluateCod,
} from "./cod-policy";

const ok = { pairs: 1, pendingCodOrders: 0, isBlocked: false };

describe("cod-policy", () => {
  it("константи", () => {
    expect(COD_MAX_PAIRS).toBe(3);
    expect(COD_MAX_PENDING_PER_PHONE).toBe(2);
    expect(COD_WINDOW_MS).toBe(86_400_000);
  });

  it("countPairs сумує кількість", () => {
    expect(countPairs([])).toBe(0);
    expect(countPairs([{ quantity: 1 }, { quantity: 2 }])).toBe(3);
  });

  it("0 і 1 замовлення дозволені, 2 заборонено", () => {
    expect(evaluateCod({ ...ok, pendingCodOrders: 0 })).toEqual({ allowed: true });
    expect(evaluateCod({ ...ok, pendingCodOrders: 1 })).toEqual({ allowed: true });
    expect(evaluateCod({ ...ok, pendingCodOrders: 2 })).toEqual({
      allowed: false,
      reason: "PHONE_LIMIT",
    });
  });

  it("3 пари дозволено, 4 заборонено", () => {
    expect(evaluateCod({ ...ok, pairs: 3 })).toEqual({ allowed: true });
    expect(evaluateCod({ ...ok, pairs: 4 })).toEqual({
      allowed: false,
      reason: "TOO_MANY_PAIRS",
    });
  });

  it("блокування важливіше за інші причини", () => {
    expect(evaluateCod({ pairs: 10, pendingCodOrders: 5, isBlocked: true })).toEqual({
      allowed: false,
      reason: "BLOCKED",
    });
  });

  it("ліміт номера важливіший за ліміт пар", () => {
    expect(evaluateCod({ pairs: 10, pendingCodOrders: 2, isBlocked: false })).toEqual({
      allowed: false,
      reason: "PHONE_LIMIT",
    });
  });
});
