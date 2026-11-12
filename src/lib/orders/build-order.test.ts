import { describe, expect, it } from "vitest";
import {
  MAX_QUANTITY_PER_ITEM,
  buildOrderItems,
  generateOrderNumber,
  type OrderVariant,
} from "./build-order";

function makeVariant(overrides: Partial<OrderVariant> = {}, product: Partial<OrderVariant["product"]> = {}): OrderVariant {
  return {
    id: "v1",
    stock: 1,
    sku: null,
    size: { value: "38" },
    color: { name: "Чорний" },
    product: {
      id: "p1",
      name: "Лофери",
      sku: "LOF-1",
      isPublished: true,
      price: "2000.00",
      discountPrice: null,
      ...product,
    },
    ...overrides,
  };
}

describe("MAX_QUANTITY_PER_ITEM", () => {
  it("дорівнює 10", () => {
    expect(MAX_QUANTITY_PER_ITEM).toBe(10);
  });
});

describe("buildOrderItems", () => {
  it("рахує звичайне замовлення", () => {
    const result = buildOrderItems(
      [{ variantId: "v1", quantity: 2 }],
      [makeVariant()]
    );

    expect(result).toEqual({
      ok: true,
      orderItems: [
        {
          productId: "p1",
          variantId: "v1",
          productName: "Лофери",
          sku: "LOF-1",
          size: "38",
          color: "Чорний",
          price: 2000,
          quantity: 2,
          total: 4000,
        },
      ],
      subtotal: 4000,
    });
  });

  it("бере sku варіанта, якщо він є", () => {
    const result = buildOrderItems(
      [{ variantId: "v1", quantity: 1 }],
      [makeVariant({ sku: "LOF-1-38" })]
    );

    expect(result.ok && result.orderItems[0].sku).toBe("LOF-1-38");
  });

  it("використовує ціну зі знижкою", () => {
    const result = buildOrderItems(
      [{ variantId: "v1", quantity: 2 }],
      [makeVariant({}, { discountPrice: { toString: () => "1500.50" } })]
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.orderItems[0].price).toBe(1500.5);
      expect(result.orderItems[0].total).toBe(3001);
      expect(result.subtotal).toBe(3001);
    }
  });

  it("склеює однакові variantId", () => {
    const result = buildOrderItems(
      [
        { variantId: "v1", quantity: 1 },
        { variantId: "v2", quantity: 1 },
        { variantId: "v1", quantity: 2 },
      ],
      [makeVariant(), makeVariant({ id: "v2" }, { id: "p2" })]
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.orderItems).toHaveLength(2);
      expect(result.orderItems[0].variantId).toBe("v1");
      expect(result.orderItems[0].quantity).toBe(3);
      expect(result.orderItems[0].total).toBe(6000);
      expect(result.orderItems[1].quantity).toBe(1);
      expect(result.subtotal).toBe(8000);
    }
  });

  it("відхиляє прихований товар", () => {
    const result = buildOrderItems(
      [{ variantId: "v1", quantity: 1 }],
      [makeVariant({}, { isPublished: false })]
    );

    expect(result).toEqual({ ok: false, unavailableVariantIds: ["v1"] });
  });

  it("відхиляє варіант зі stock = 0", () => {
    const result = buildOrderItems(
      [{ variantId: "v1", quantity: 1 }],
      [makeVariant({ stock: 0 })]
    );

    expect(result).toEqual({ ok: false, unavailableVariantIds: ["v1"] });
  });

  it("відхиляє відсутній варіант і повертає всі недоступні id", () => {
    const result = buildOrderItems(
      [
        { variantId: "v1", quantity: 1 },
        { variantId: "missing", quantity: 1 },
        { variantId: "v3", quantity: 1 },
      ],
      [makeVariant(), makeVariant({ id: "v3", stock: 0 })]
    );

    expect(result).toEqual({
      ok: false,
      unavailableVariantIds: ["missing", "v3"],
    });
  });

  it("не порівнює кількість із stock", () => {
    const result = buildOrderItems(
      [{ variantId: "v1", quantity: 5 }],
      [makeVariant({ stock: 1 })]
    );

    expect(result.ok).toBe(true);
  });

  it("округлює до копійок (3 x 1999.99)", () => {
    const result = buildOrderItems(
      [{ variantId: "v1", quantity: 3 }],
      [makeVariant({}, { price: "1999.99" })]
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.orderItems[0].total).toBe(5999.97);
      expect(result.subtotal).toBe(5999.97);
    }
  });

  it("округлює суму позицій з плаваючою похибкою", () => {
    const result = buildOrderItems(
      [
        { variantId: "v1", quantity: 1 },
        { variantId: "v2", quantity: 1 },
      ],
      [
        makeVariant({}, { price: "0.1" }),
        makeVariant({ id: "v2" }, { id: "p2", price: "0.2" }),
      ]
    );

    expect(result.ok && result.subtotal).toBe(0.3);
  });
});

describe("generateOrderNumber", () => {
  const format = /^LMF-\d{6}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/;

  it("має формат LMF-YYMMDD-XXXX", () => {
    expect(generateOrderNumber(new Date(2026, 10, 5))).toMatch(format);
  });

  it("підставляє дату з нулями", () => {
    const number = generateOrderNumber(new Date(2026, 0, 3), () => 0);
    expect(number).toBe("LMF-260103-AAAA");
  });

  it("використовує переданий генератор і не виходить за алфавіт", () => {
    const number = generateOrderNumber(new Date(2026, 10, 5), () => 0.999999);
    expect(number).toBe("LMF-261105-9999");
    expect(number).toMatch(format);
  });

  it("випадкові номери завжди відповідають формату", () => {
    for (let i = 0; i < 200; i += 1) {
      expect(generateOrderNumber(new Date())).toMatch(format);
    }
  });
});
