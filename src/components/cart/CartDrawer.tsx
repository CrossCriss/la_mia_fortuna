"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format-price";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { formatVariantLabel } from "@/lib/color-print";

export function CartDrawer() {
  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const close = useCartStore((state) => state.close);
  const removeItem = useCartStore((state) => state.removeItem);
  const setQuantity = useCartStore((state) => state.setQuantity);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={close}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-surface shadow-xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display font-bold text-ink">Кошик</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Закрити кошик"
            className="text-lg text-ink/60 transition hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="text-sm text-ink-soft">Кошик порожній.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-card bg-secondary/25">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <PlaceholderImage compact />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{item.name}</p>
                    {formatVariantLabel(item.size, item.color) && (
                      <p className="text-xs text-ink-soft">
                        {formatVariantLabel(item.size, item.color)}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) =>
                          setQuantity(item.variantId, Math.max(1, Number(event.target.value) || 1))
                        }
                        className="w-14 rounded-lg border border-border px-1 py-0.5 text-sm"
                      />
                      <span className="text-sm font-bold text-ink">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    aria-label="Видалити з кошика"
                    className="text-ink/40 transition hover:text-ink"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border p-4">
          <div className="mb-3 flex items-center justify-between text-sm font-bold text-ink">
            <span>Разом</span>
            <span>{formatPrice(total)}</span>
          </div>
          <Link
            href="/checkout"
            onClick={close}
            className={cn(
              "block w-full rounded-full bg-accent py-3.5 text-center text-sm font-bold text-white transition hover:bg-accent-dark",
              items.length === 0 && "pointer-events-none opacity-50"
            )}
          >
            Оформити замовлення
          </Link>
        </div>
      </aside>
    </>
  );
}
