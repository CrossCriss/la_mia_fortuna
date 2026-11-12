import { describe, expect, it } from "vitest";
import { resolvePaymentUpdate } from "./resolve-payment-update";

const baseOrder = {
  status: "NEW",
  paymentStatus: "PENDING",
  total: 1250.5,
  paymentProviderInvoiceId: "inv-1",
};

function result(status: "PAID" | "FAILED" | "REFUNDED" | "PENDING", amount: number | null = 1250.5, invoiceId = "inv-1") {
  return { status, amount, invoiceId };
}

describe("resolvePaymentUpdate", () => {
  it("rule 1: PENDING ігнорується", () => {
    expect(resolvePaymentUpdate(baseOrder, result("PENDING"))).toEqual({ kind: "ignore", reason: "pending_status" });
  });

  it("rule 1: processing після PAID не змінює статус", () => {
    const decision = resolvePaymentUpdate({ ...baseOrder, paymentStatus: "PAID", status: "CONFIRMED" }, result("PENDING"));
    expect(decision.kind).toBe("ignore");
  });

  it("rule 2: заказ з REFUNDED ігнорує будь-які вебхуки", () => {
    for (const status of ["PAID", "FAILED", "REFUNDED"] as const) {
      const decision = resolvePaymentUpdate({ ...baseOrder, paymentStatus: "REFUNDED" }, result(status));
      expect(decision.kind).toBe("ignore");
    }
  });

  it("rule 3: інший invoiceId ігнорується", () => {
    expect(resolvePaymentUpdate(baseOrder, result("PAID", 1250.5, "other"))).toEqual({
      kind: "ignore",
      reason: "invoice_mismatch",
    });
  });

  it("rule 3: без збереженого invoiceId перевірка не застосовується", () => {
    const decision = resolvePaymentUpdate({ ...baseOrder, paymentProviderInvoiceId: null }, result("PAID", 1250.5, "any"));
    expect(decision.kind).toBe("update");
  });

  it("rule 4: PAID + REFUNDED дає update без зміни статусу замовлення", () => {
    const decision = resolvePaymentUpdate({ ...baseOrder, paymentStatus: "PAID", status: "SHIPPED" }, result("REFUNDED"));
    expect(decision).toEqual({ kind: "update", paymentStatus: "REFUNDED", status: "SHIPPED", becamePaid: false });
  });

  it("rule 4: PAID + FAILED або повторний PAID ігноруються", () => {
    const order = { ...baseOrder, paymentStatus: "PAID", status: "CONFIRMED" };
    expect(resolvePaymentUpdate(order, result("FAILED")).kind).toBe("ignore");
    expect(resolvePaymentUpdate(order, result("PAID")).kind).toBe("ignore");
  });

  it("rule 5: success зі збігом суми підтверджує замовлення NEW", () => {
    expect(resolvePaymentUpdate(baseOrder, result("PAID"))).toEqual({
      kind: "update",
      paymentStatus: "PAID",
      status: "CONFIRMED",
      becamePaid: true,
    });
  });

  it("rule 5: success з невірною сумою ігнорується", () => {
    expect(resolvePaymentUpdate(baseOrder, result("PAID", 10))).toEqual({ kind: "ignore", reason: "amount_mismatch" });
  });

  it("rule 5: порівняння суми йде в копійках (плаваюча кома)", () => {
    const decision = resolvePaymentUpdate({ ...baseOrder, total: 0.3 }, result("PAID", 0.1 + 0.2));
    expect(decision.kind).toBe("update");
  });

  it("rule 5: amount null не блокує оплату", () => {
    expect(resolvePaymentUpdate(baseOrder, result("PAID", null)).kind).toBe("update");
  });

  it("rule 5: заказ SHIPPED залишається SHIPPED при оплаті", () => {
    const decision = resolvePaymentUpdate({ ...baseOrder, status: "SHIPPED" }, result("PAID"));
    expect(decision).toEqual({ kind: "update", paymentStatus: "PAID", status: "SHIPPED", becamePaid: true });
  });

  it("rule 6: FAILED при PENDING оновлює paymentStatus, статус замовлення не чіпає", () => {
    expect(resolvePaymentUpdate(baseOrder, result("FAILED"))).toEqual({
      kind: "update",
      paymentStatus: "FAILED",
      status: "NEW",
      becamePaid: false,
    });
  });

  it("rule 6: REFUNDED при FAILED оновлює paymentStatus", () => {
    const decision = resolvePaymentUpdate({ ...baseOrder, paymentStatus: "FAILED" }, result("REFUNDED"));
    expect(decision).toEqual({ kind: "update", paymentStatus: "REFUNDED", status: "NEW", becamePaid: false });
  });

  it("FAILED після PENDING, потім запізнілий PAID при FAILED зараховується", () => {
    const decision = resolvePaymentUpdate({ ...baseOrder, paymentStatus: "FAILED" }, result("PAID"));
    expect(decision).toMatchObject({ kind: "update", paymentStatus: "PAID", becamePaid: true });
  });
});
