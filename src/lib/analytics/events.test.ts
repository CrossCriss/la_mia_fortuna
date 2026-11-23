import { afterEach, describe, expect, it, vi } from "vitest";
import { toGa4, toMetaPixel, type AnalyticsEvent, type AnalyticsItem } from "./events";
import { isAnalyticsReady, track } from "./track";

const itemA: AnalyticsItem = { id: "sukhmyana-bluza", name: "Сорочка", price: 1299.99, quantity: 2, variant: "M / Білий" };
const itemB: AnalyticsItem = { id: "dzhynsy", name: "Джинси", price: 850, quantity: 1 };

describe("toGa4", () => {
  it("view_item: валюта, сума, позиція з варіантом", () => {
    const r = toGa4({ name: "view_item", item: itemA });
    expect(r.name).toBe("view_item");
    expect(r.params.currency).toBe("UAH");
    expect(r.params.value).toBe(2599.98);
    expect(r.params.items).toEqual([
      { item_id: "sukhmyana-bluza", item_name: "Сорочка", price: 1299.99, quantity: 2, item_variant: "M / Білий" },
    ]);
    expect(r.params.transaction_id).toBeUndefined();
  });

  it("item_variant відсутній, якщо варіанта немає", () => {
    const r = toGa4({ name: "add_to_cart", item: itemB });
    expect(r.name).toBe("add_to_cart");
    expect(r.params.value).toBe(850);
    expect("item_variant" in r.params.items[0]).toBe(false);
  });

  it("begin_checkout: сума по всіх позиціях округлюється до копійок", () => {
    const r = toGa4({
      name: "begin_checkout",
      items: [
        { id: "a", name: "A", price: 0.1, quantity: 3 },
        { id: "b", name: "B", price: 0.2, quantity: 1 },
      ],
    });
    expect(r.name).toBe("begin_checkout");
    expect(r.params.value).toBe(0.5);
    expect(r.params.items).toHaveLength(2);
  });

  it("purchase: transaction_id та передане value", () => {
    const r = toGa4({ name: "purchase", orderNumber: "LMF-100", items: [itemA, itemB], value: 3449.985 });
    expect(r.name).toBe("purchase");
    expect(r.params.transaction_id).toBe("LMF-100");
    expect(r.params.value).toBe(3449.99);
    expect(r.params.currency).toBe("UAH");
    expect(r.params.items.map((i) => i.item_id)).toEqual(["sukhmyana-bluza", "dzhynsy"]);
  });
});

describe("toMetaPixel", () => {
  it("view_item -> ViewContent без num_items і eventId", () => {
    const r = toMetaPixel({ name: "view_item", item: itemA });
    expect(r.name).toBe("ViewContent");
    expect(r.params).toEqual({
      content_type: "product",
      content_ids: ["sukhmyana-bluza"],
      contents: [{ id: "sukhmyana-bluza", quantity: 2 }],
      value: 2599.98,
      currency: "UAH",
    });
    expect(r.params.num_items).toBeUndefined();
    expect(r.eventId).toBeUndefined();
  });

  it("add_to_cart -> AddToCart без num_items і eventId", () => {
    const r = toMetaPixel({ name: "add_to_cart", item: itemB });
    expect(r.name).toBe("AddToCart");
    expect(r.params.value).toBe(850);
    expect(r.params.num_items).toBeUndefined();
    expect(r.eventId).toBeUndefined();
  });

  it("begin_checkout -> InitiateCheckout з num_items", () => {
    const r = toMetaPixel({ name: "begin_checkout", items: [itemA, itemB] });
    expect(r.name).toBe("InitiateCheckout");
    expect(r.params.content_ids).toEqual(["sukhmyana-bluza", "dzhynsy"]);
    expect(r.params.contents).toEqual([
      { id: "sukhmyana-bluza", quantity: 2 },
      { id: "dzhynsy", quantity: 1 },
    ]);
    expect(r.params.value).toBe(3449.98);
    expect(r.params.num_items).toBe(3);
    expect(r.eventId).toBeUndefined();
  });

  it("purchase -> Purchase з num_items і eventId = orderNumber", () => {
    const r = toMetaPixel({ name: "purchase", orderNumber: "LMF-100", items: [itemA, itemB], value: 3500 });
    expect(r.name).toBe("Purchase");
    expect(r.params.value).toBe(3500);
    expect(r.params.currency).toBe("UAH");
    expect(r.params.num_items).toBe(3);
    expect(r.eventId).toBe("LMF-100");
  });
});

describe("track", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const purchase: AnalyticsEvent = { name: "purchase", orderNumber: "LMF-7", items: [itemB], value: 850 };

  it("без window нічого не падає, isAnalyticsReady = false", () => {
    expect(typeof window).toBe("undefined");
    expect(() => track(purchase)).not.toThrow();
    expect(isAnalyticsReady()).toBe(false);
  });

  it("викликає gtag і fbq з правильними аргументами", () => {
    const gtag = vi.fn();
    const fbq = vi.fn();
    vi.stubGlobal("window", { gtag, fbq });

    track(purchase);

    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith("event", "purchase", toGa4(purchase).params);
    expect(fbq).toHaveBeenCalledTimes(1);
    expect(fbq).toHaveBeenCalledWith("track", "Purchase", toMetaPixel(purchase).params, { eventID: "LMF-7" });
    expect(isAnalyticsReady()).toBe(true);
  });

  it("для подій без eventId четвертий аргумент fbq - undefined", () => {
    const fbq = vi.fn();
    vi.stubGlobal("window", { fbq });

    track({ name: "view_item", item: itemB });

    expect(fbq).toHaveBeenCalledWith("track", "ViewContent", expect.any(Object), undefined);
  });

  it("працює, якщо підключений лише один зі скриптів", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });
    expect(() => track({ name: "add_to_cart", item: itemB })).not.toThrow();
    expect(gtag).toHaveBeenCalledWith("event", "add_to_cart", expect.any(Object));
    expect(isAnalyticsReady()).toBe(true);
  });

  it("виняток у gtag не пробрасується і не блокує fbq", () => {
    const gtag = vi.fn(() => {
      throw new Error("gtag boom");
    });
    const fbq = vi.fn();
    vi.stubGlobal("window", { gtag, fbq });

    expect(() => track(purchase)).not.toThrow();
    expect(fbq).toHaveBeenCalledTimes(1);
  });

  it("виняток у fbq не пробрасується", () => {
    const fbq = vi.fn(() => {
      throw new Error("fbq boom");
    });
    vi.stubGlobal("window", { fbq });
    expect(() => track(purchase)).not.toThrow();
  });
});
