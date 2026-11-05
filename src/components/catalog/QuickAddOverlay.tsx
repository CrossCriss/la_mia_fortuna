"use client";

import { useEffect, useMemo, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import { classifyVariantOption, isRealSizeName } from "@/lib/color-print";
import type { Variant } from "@/components/product/ProductOptions";

// Швидке додавання в кошик прямо з картки каталогу, без переходу на
// сторінку товару. Колір/принт і розмір рахуються тією ж логікою, що й на
// сторінці товару (ProductOptions/color-print.ts), але вибір тут навмисно
// не має дефолту — поки покупець не обрав обов'язковий параметр, кнопка
// підсвічує невибраний чипс замість сабміту. Степпер кількості показується
// завжди, незалежно від того, чи є в товару колір/розмір — панель ніколи
// не пропускається повністю.
export function QuickAddOverlay({
  productSlug,
  productName,
  price,
  discountPrice,
  image,
  variants,
  open,
  onOpenChange,
}: {
  productSlug: string;
  productName: string;
  price: number;
  discountPrice?: number | null;
  image?: string;
  variants: Variant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const addItem = useCartStore((state) => state.addItem);

  const colors = useMemo(() => {
    const byName = new Map<string, string>();
    variants.forEach((variant) => byName.set(variant.color, variant.colorHex));
    return Array.from(byName.entries())
      .map(([name, hex]) => ({ name, hex, ...classifyVariantOption(name, productName) }))
      .filter((color) => color.kind !== "hidden");
  }, [variants, productName]);
  const hasColorOptions = colors.length > 0;

  const hasSizeOptions = useMemo(
    () => variants.some((variant) => isRealSizeName(variant.size)),
    [variants]
  );

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [colorError, setColorError] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!open) {
      setColorError(false);
      setSizeError(false);
    }
  }, [open]);

  const sizeCandidates = useMemo(() => {
    const pool = hasColorOptions && selectedColor ? variants.filter((v) => v.color === selectedColor) : variants;
    const bySize = new Map<string, number>();
    pool.forEach((variant) => {
      if (!isRealSizeName(variant.size)) return;
      bySize.set(variant.size, Math.max(bySize.get(variant.size) ?? 0, variant.stock));
    });
    return Array.from(bySize.entries()).map(([size, stock]) => ({ size, stock }));
  }, [variants, selectedColor, hasColorOptions]);

  // Без обраних кольору/розміру (коли їх немає в товару) кандидатами є всі
  // варіанти — серед них береться перший з наявним залишком.
  const activeVariant = useMemo(() => {
    const candidates = variants.filter((variant) => {
      if (hasColorOptions && variant.color !== selectedColor) return false;
      if (hasSizeOptions && variant.size !== selectedSize) return false;
      return true;
    });
    if (candidates.length === 0) return undefined;
    return candidates.find((v) => v.stock > 0) ?? candidates[0];
  }, [variants, selectedColor, selectedSize, hasColorOptions, hasSizeOptions]);

  const maxQuantity = activeVariant?.stock ?? 0;

  function stop(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function resetSelection() {
    setSelectedColor(null);
    setSelectedSize(null);
    setQuantity(1);
  }

  function showFeedback() {
    setJustAdded(true);
    window.setTimeout(() => {
      setJustAdded(false);
      onOpenChange(false);
      resetSelection();
    }, 1500);
  }

  function handleColorSelect(event: React.MouseEvent, name: string) {
    stop(event);
    setSelectedColor(name);
    setColorError(false);
    setSelectedSize(null);
  }

  function handleSizeSelect(event: React.MouseEvent, size: string) {
    stop(event);
    setSelectedSize(size);
    setSizeError(false);
  }

  function attemptSubmit(event?: React.MouseEvent) {
    if (event) stop(event);

    let hasError = false;
    if (hasColorOptions && !selectedColor) {
      setColorError(true);
      hasError = true;
    }
    if (hasSizeOptions && !selectedSize) {
      setSizeError(true);
      hasError = true;
    }
    if (hasError || !activeVariant || activeVariant.stock < 1) return;

    addItem({
      variantId: activeVariant.id,
      productSlug,
      name: productName,
      size: activeVariant.size,
      color: activeVariant.color,
      price: discountPrice ?? price,
      quantity,
      image,
    });
    showFeedback();
  }

  function handleTriggerClick(event: React.MouseEvent) {
    stop(event);
    if (justAdded) return;

    if (!open) {
      onOpenChange(true);
      return;
    }

    attemptSubmit();
  }

  return (
    <div className="absolute inset-x-2 bottom-2 z-10 flex flex-col-reverse gap-2">
      <button
        type="button"
        onClick={handleTriggerClick}
        className="w-full rounded-full bg-accent py-2 text-xs font-bold text-white shadow-md transition duration-150 ease-out hover:bg-accent-dark"
      >
        {justAdded ? "Додано ✓" : "Додати в кошик"}
      </button>

      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className="max-h-40 overflow-y-auto rounded-card bg-white/97 p-3 shadow-lg backdrop-blur-sm"
            onClick={stop}
          >
            {hasColorOptions && (
              <div className="mb-2">
                <p
                  className={cn(
                    "mb-1 text-[11px] font-medium",
                    colorError ? "text-red-600" : "text-ink-soft"
                  )}
                >
                  {colors[0]?.kind === "print" ? "Принт" : "Колір"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {colors.map((color) =>
                    color.kind === "color" ? (
                      <button
                        key={color.name}
                        type="button"
                        title={color.label}
                        onClick={(event) => handleColorSelect(event, color.name)}
                        className={cn(
                          "h-6 w-6 rounded-full border-2 transition",
                          selectedColor === color.name
                            ? "border-accent"
                            : colorError
                            ? "border-red-400"
                            : "border-ink/15 hover:border-ink/30"
                        )}
                        style={{ backgroundColor: color.hex }}
                      />
                    ) : (
                      <button
                        key={color.name}
                        type="button"
                        onClick={(event) => handleColorSelect(event, color.name)}
                        className={cn(
                          "rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition",
                          selectedColor === color.name
                            ? "border-accent bg-accent text-white"
                            : colorError
                            ? "border-red-400 text-red-600"
                            : "border-ink/15 text-ink/70"
                        )}
                      >
                        {color.label}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {hasSizeOptions && (
              <div className="mb-2">
                <p
                  className={cn(
                    "mb-1 text-[11px] font-medium",
                    sizeError ? "text-red-600" : "text-ink-soft"
                  )}
                >
                  Розмір
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sizeCandidates.map(({ size, stock }) => (
                    <button
                      key={size}
                      type="button"
                      disabled={stock === 0}
                      onClick={(event) => handleSizeSelect(event, size)}
                      className={cn(
                        "flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-[11px] font-bold transition",
                        stock === 0
                          ? "cursor-not-allowed border-ink/10 text-ink/25 line-through"
                          : selectedSize === size
                          ? "border-accent bg-accent text-white"
                          : sizeError
                          ? "border-red-400 text-red-600"
                          : "border-ink/15 text-ink/70"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={(event) => {
                  stop(event);
                  setQuantity((q) => Math.max(1, q - 1));
                }}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/15 text-sm leading-none text-ink/70"
              >
                −
              </button>
              <span className="w-4 text-center text-xs font-bold text-ink">{quantity}</span>
              <button
                type="button"
                onClick={(event) => {
                  stop(event);
                  setQuantity((q) => (maxQuantity ? Math.min(maxQuantity, q + 1) : q + 1));
                }}
                disabled={maxQuantity > 0 && quantity >= maxQuantity}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/15 text-sm leading-none text-ink/70 disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
