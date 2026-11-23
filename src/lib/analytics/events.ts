// Внутрішні події аналітики та їх перетворення у формати GA4 і Meta Pixel.
// Чисті функції без доступу до window, щоб їх було легко тестувати.

export type AnalyticsItem = {
  /** Slug товару */
  id: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
};

export type AnalyticsEvent =
  | { name: "view_item"; item: AnalyticsItem }
  | { name: "add_to_cart"; item: AnalyticsItem }
  | { name: "begin_checkout"; items: AnalyticsItem[] }
  | { name: "purchase"; orderNumber: string; items: AnalyticsItem[]; value: number };

export type Ga4Item = {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_variant?: string;
};

export type Ga4Payload = {
  name: "view_item" | "add_to_cart" | "begin_checkout" | "purchase";
  params: {
    currency: "UAH";
    value: number;
    items: Ga4Item[];
    transaction_id?: string;
  };
};

export type MetaPixelPayload = {
  name: "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase";
  params: {
    content_type: "product";
    content_ids: string[];
    contents: Array<{ id: string; quantity: number }>;
    value: number;
    currency: "UAH";
    num_items?: number;
  };
  eventId?: string;
};

const CURRENCY = "UAH" as const;

/** Округлення до копійок */
function roundMoney(x: number): number {
  return Math.round(x * 100) / 100;
}

/** Позиції події (для одиночних подій це масив з одного елемента) */
function getItems(event: AnalyticsEvent): AnalyticsItem[] {
  return "item" in event ? [event.item] : event.items;
}

/** Сума price * quantity по позиціях, а для purchase - передане значення */
function getValue(event: AnalyticsEvent): number {
  if (event.name === "purchase") return roundMoney(event.value);
  const sum = getItems(event).reduce((acc, i) => acc + i.price * i.quantity, 0);
  return roundMoney(sum);
}

export function toGa4(event: AnalyticsEvent): Ga4Payload {
  const items: Ga4Item[] = getItems(event).map((i) => {
    const out: Ga4Item = {
      item_id: i.id,
      item_name: i.name,
      price: i.price,
      quantity: i.quantity,
    };
    if (i.variant) out.item_variant = i.variant;
    return out;
  });

  const params: Ga4Payload["params"] = {
    currency: CURRENCY,
    value: getValue(event),
    items,
  };
  if (event.name === "purchase") params.transaction_id = event.orderNumber;

  return { name: event.name, params };
}

export function toMetaPixel(event: AnalyticsEvent): MetaPixelPayload {
  const items = getItems(event);

  const params: MetaPixelPayload["params"] = {
    content_type: "product",
    content_ids: items.map((i) => i.id),
    contents: items.map((i) => ({ id: i.id, quantity: i.quantity })),
    value: getValue(event),
    currency: CURRENCY,
  };

  switch (event.name) {
    case "view_item":
      return { name: "ViewContent", params };
    case "add_to_cart":
      return { name: "AddToCart", params };
    case "begin_checkout":
      params.num_items = items.reduce((acc, i) => acc + i.quantity, 0);
      return { name: "InitiateCheckout", params };
    case "purchase":
      params.num_items = items.reduce((acc, i) => acc + i.quantity, 0);
      return { name: "Purchase", params, eventId: event.orderNumber };
  }
}
