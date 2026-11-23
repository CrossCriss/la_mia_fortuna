import { describe, expect, it } from "vitest";
import { createOrderSchema } from "./checkout-schema";

const validOrder = {
  customerName: "Іван Петренко",
  phone: "0501234567",
  shippingCity: "Київ",
  shippingCityRef: "city-ref",
  shippingWarehouse: "Відділення 1",
  shippingWarehouseRef: "wh-ref",
  paymentMethod: "CASH_ON_DELIVERY" as const,
  items: [{ variantId: "v1", quantity: 1 }],
};

describe("createOrderSchema", () => {
  it("приймає коректне замовлення", () => {
    expect(createOrderSchema.safeParse(validOrder).success).toBe(true);
  });

  it.each(["0501234567", "+380501234567", "380501234567"])("приймає телефон %s", (phone) => {
    expect(createOrderSchema.safeParse({ ...validOrder, phone }).success).toBe(true);
  });

  it.each(["12345", "05012345", "+1501234567", "abc"])("відхиляє телефон %s", (phone) => {
    expect(createOrderSchema.safeParse({ ...validOrder, phone }).success).toBe(false);
  });

  it("відхиляє порожній items", () => {
    expect(createOrderSchema.safeParse({ ...validOrder, items: [] }).success).toBe(false);
  });

  it("відхиляє більше 30 позицій", () => {
    const items = Array.from({ length: 31 }, (_, i) => ({ variantId: `v${i}`, quantity: 1 }));
    expect(createOrderSchema.safeParse({ ...validOrder, items }).success).toBe(false);
  });

  it("приймає рівно 30 позицій", () => {
    const items = Array.from({ length: 30 }, (_, i) => ({ variantId: `v${i}`, quantity: 1 }));
    expect(createOrderSchema.safeParse({ ...validOrder, items }).success).toBe(true);
  });

  it("відхиляє кількість 0", () => {
    const items = [{ variantId: "v1", quantity: 0 }];
    expect(createOrderSchema.safeParse({ ...validOrder, items }).success).toBe(false);
  });

  it("відхиляє кількість 11", () => {
    const items = [{ variantId: "v1", quantity: 11 }];
    expect(createOrderSchema.safeParse({ ...validOrder, items }).success).toBe(false);
  });

  it("приймає кількість 10", () => {
    const items = [{ variantId: "v1", quantity: 10 }];
    expect(createOrderSchema.safeParse({ ...validOrder, items }).success).toBe(true);
  });

  it("відхиляє дробову кількість", () => {
    const items = [{ variantId: "v1", quantity: 1.5 }];
    expect(createOrderSchema.safeParse({ ...validOrder, items }).success).toBe(false);
  });

  it.each(["ONLINE_CARD", "CASH_ON_DELIVERY"] as const)("приймає paymentMethod %s", (paymentMethod) => {
    expect(createOrderSchema.safeParse({ ...validOrder, paymentMethod }).success).toBe(true);
  });

  it("відхиляє невідомий paymentMethod", () => {
    expect(createOrderSchema.safeParse({ ...validOrder, paymentMethod: "LIQPAY" }).success).toBe(false);
  });

  it("відхиляє дублікати одного variantId із сумарною кількістю більше 10", () => {
    const items = [
      { variantId: "v1", quantity: 10 },
      { variantId: "v1", quantity: 10 },
    ];
    expect(createOrderSchema.safeParse({ ...validOrder, items }).success).toBe(false);
  });

  it("приймає дублікати із сумарною кількістю не більше 10", () => {
    const items = [
      { variantId: "v1", quantity: 4 },
      { variantId: "v1", quantity: 6 },
    ];
    expect(createOrderSchema.safeParse({ ...validOrder, items }).success).toBe(true);
  });

  it("не складає кількість різних варіантів", () => {
    const items = [
      { variantId: "v1", quantity: 10 },
      { variantId: "v2", quantity: 10 },
    ];
    expect(createOrderSchema.safeParse({ ...validOrder, items }).success).toBe(true);
  });

  describe("attribution", () => {
    const marks = {
      utm_source: "facebook",
      utm_medium: "cpc",
      utm_campaign: "autumn",
      capturedAt: "2026-11-20T10:00:00.000Z",
    };

    it("приймає замовлення без attribution", () => {
      const result = createOrderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.attribution).toBeUndefined();
    });

    it("зберігає атрибуцію з мітками", () => {
      const result = createOrderSchema.safeParse({ ...validOrder, attribution: marks });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.attribution).toEqual(marks);
    });

    it("відкидає зайві ключі атрибуції", () => {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        attribution: { ...marks, evil: "x" },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.attribution).toEqual(marks);
        expect(result.data.attribution).not.toHaveProperty("evil");
      }
    });

    it("рядок довший за 200 символів: атрибуція відкидається, замовлення валідне", () => {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        attribution: { ...marks, utm_source: "a".repeat(201) },
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.attribution).toBeUndefined();
    });

    it("приймає рядок рівно 200 символів", () => {
      const attribution = { ...marks, utm_source: "a".repeat(200) };
      const result = createOrderSchema.safeParse({ ...validOrder, attribution });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.attribution).toEqual(attribution);
    });

    it.each([null, "text", 42, ["a"], { utm_source: 5 }])(
      "невалідна атрибуція %j не ламає замовлення",
      (attribution) => {
        const result = createOrderSchema.safeParse({ ...validOrder, attribution });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.attribution).toBeUndefined();
      },
    );
  });
});
