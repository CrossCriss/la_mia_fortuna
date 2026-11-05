"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format-price";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { formatVariantLabel } from "@/lib/color-print";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Кошик</h1>

      {items.length === 0 ? (
        <div className="mt-6">
          <p className="text-neutral-600">Кошик порожній.</p>
          <Link href="/catalog" className="mt-4 inline-block text-sm text-accent underline">
            Перейти до каталогу
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <ul className="divide-y divide-neutral-100">
            {items.map((item) => (
              <li key={item.variantId} className="flex gap-4 py-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary/25">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <PlaceholderImage compact />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${item.productSlug}`} className="font-medium hover:text-accent">
                    {item.name}
                  </Link>
                  {formatVariantLabel(item.size, item.color) && (
                    <p className="text-sm text-neutral-500">
                      {formatVariantLabel(item.size, item.color)}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) =>
                        setQuantity(item.variantId, Math.max(1, Number(event.target.value) || 1))
                      }
                      className="w-16 rounded border border-neutral-200 px-2 py-1 text-sm"
                    />
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.variantId)}
                      className="text-sm text-neutral-400 hover:text-neutral-700"
                    >
                      Видалити
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4">
            <span className="text-lg font-semibold">Разом: {formatPrice(total)}</span>
            <Link
              href="/checkout"
              className="rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-dark"
            >
              Оформити замовлення
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
