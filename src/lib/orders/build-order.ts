// Чиста логіка замовлення: розрахунок позицій і номер замовлення.
// Без доступу до БД та мережі, щоб легко тестувати.

export const MAX_QUANTITY_PER_ITEM = 10;

type DecimalLike = number | string | { toString(): string };

export type OrderInputItem = { variantId: string; quantity: number };

export type OrderVariant = {
  id: string;
  stock: number;
  sku: string | null;
  size: { value: string };
  color: { name: string };
  product: {
    id: string;
    name: string;
    sku: string;
    isPublished: boolean;
    price: DecimalLike;
    discountPrice: DecimalLike | null;
  };
};

export type OrderItemData = {
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  total: number;
};

export type BuildOrderItemsResult =
  | { ok: true; orderItems: OrderItemData[]; subtotal: number }
  | { ok: false; unavailableVariantIds: string[] };

const toNumber = (value: DecimalLike): number => Number(String(value));

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

// stock - прапорець наявності (1/0), кількість з ним не порівнюється
// і залишок не зменшується.
export function buildOrderItems(
  items: OrderInputItem[],
  variants: OrderVariant[]
): BuildOrderItemsResult {
  const quantityByVariant = new Map<string, number>();
  for (const item of items) {
    quantityByVariant.set(
      item.variantId,
      (quantityByVariant.get(item.variantId) ?? 0) + item.quantity
    );
  }

  const variantById = new Map(variants.map((variant) => [variant.id, variant]));

  const unavailableVariantIds: string[] = [];
  const orderItems: OrderItemData[] = [];

  for (const [variantId, quantity] of quantityByVariant) {
    const variant = variantById.get(variantId);

    if (!variant || variant.product.isPublished === false || variant.stock <= 0) {
      unavailableVariantIds.push(variantId);
      continue;
    }

    const rawPrice = variant.product.discountPrice ?? variant.product.price;
    const price = toNumber(rawPrice);

    orderItems.push({
      productId: variant.product.id,
      variantId: variant.id,
      productName: variant.product.name,
      sku: variant.sku ?? variant.product.sku,
      size: variant.size.value,
      color: variant.color.name,
      price,
      quantity,
      total: roundMoney(price * quantity),
    });
  }

  if (unavailableVariantIds.length > 0) {
    return { ok: false, unavailableVariantIds };
  }

  const subtotal = roundMoney(orderItems.reduce((sum, item) => sum + item.total, 0));

  return { ok: true, orderItems, subtotal };
}

const ORDER_NUMBER_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

// Формат: LMF-YYMMDD-XXXX
export function generateOrderNumber(
  now: Date,
  random: () => number = Math.random
): string {
  const yy = String(now.getFullYear() % 100).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  let suffix = "";
  for (let i = 0; i < 4; i += 1) {
    const index = Math.min(
      Math.floor(random() * ORDER_NUMBER_ALPHABET.length),
      ORDER_NUMBER_ALPHABET.length - 1
    );
    suffix += ORDER_NUMBER_ALPHABET[index];
  }

  return `LMF-${yy}${mm}${dd}-${suffix}`;
}
