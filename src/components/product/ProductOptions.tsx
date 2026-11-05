"use client";

import { useMemo, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format-price";
import { classifyVariantOption } from "@/lib/color-print";
import { Button } from "@/components/ui/Button";

export type Variant = {
  id: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
};

export function ProductOptions({
  productSlug,
  name,
  price,
  discountPrice,
  image,
  variants,
}: {
  productSlug: string;
  name: string;
  price: number;
  discountPrice: number | null;
  image?: string;
  variants: Variant[];
}) {
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.open);

  const colors = useMemo(() => {
    const byName = new Map<string, string>();
    variants.forEach((variant) => byName.set(variant.color, variant.colorHex));
    return Array.from(byName.entries()).map(([colorName, hex]) => ({
      name: colorName,
      hex,
      ...classifyVariantOption(colorName, name),
    }));
  }, [variants, name]);

  // Товари без реального кольору й без розпізнаного принта (kind "hidden")
  // не показуємо в пікері — вибирати нема з чого, лише розмір.
  const visibleColors = useMemo(() => colors.filter((c) => c.kind !== "hidden"), [colors]);

  const [selectedColor, setSelectedColor] = useState(visibleColors[0]?.name ?? colors[0]?.name ?? "");

  const sizesForColor = useMemo(
    () => variants.filter((variant) => variant.color === selectedColor),
    [variants, selectedColor]
  );

  const [selectedSize, setSelectedSize] = useState(
    sizesForColor.find((variant) => variant.stock > 0)?.size ?? sizesForColor[0]?.size ?? ""
  );

  function handleColorChange(colorName: string) {
    setSelectedColor(colorName);
    const options = variants.filter((variant) => variant.color === colorName);
    setSelectedSize(options.find((variant) => variant.stock > 0)?.size ?? options[0]?.size ?? "");
  }

  const activeVariant = variants.find(
    (variant) => variant.color === selectedColor && variant.size === selectedSize
  );
  const effectivePrice = discountPrice ?? price;
  const inStock = (activeVariant?.stock ?? 0) > 0;

  function handleAddToCart() {
    if (!activeVariant || !inStock) return;
    addItem({
      variantId: activeVariant.id,
      productSlug,
      name,
      size: activeVariant.size,
      color: activeVariant.color,
      price: effectivePrice,
      quantity: 1,
      image,
    });
    openCart();
  }

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-extrabold text-ink">
          {formatPrice(effectivePrice)}
        </span>
        {discountPrice != null && (
          <span className="text-base text-ink-soft line-through">{formatPrice(price)}</span>
        )}
      </div>

      {visibleColors.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium">
            {(() => {
              const selected = visibleColors.find((c) => c.name === selectedColor);
              if (!selected) return null;
              return selected.kind === "print" ? `Принт: ${selected.label}` : `Колір: ${selected.label}`;
            })()}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {visibleColors.map((color) =>
              color.kind === "color" ? (
                <button
                  key={color.name}
                  type="button"
                  title={color.label}
                  onClick={() => handleColorChange(color.name)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition",
                    selectedColor === color.name ? "border-accent" : "border-ink/15 hover:border-ink/30"
                  )}
                  style={{ backgroundColor: color.hex }}
                />
              ) : (
                <button
                  key={color.name}
                  type="button"
                  title={color.label}
                  onClick={() => handleColorChange(color.name)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-semibold transition",
                    selectedColor === color.name
                      ? "border-accent bg-accent text-white"
                      : "border-ink/15 text-ink/70 hover:border-accent/50"
                  )}
                >
                  {color.label}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {sizesForColor.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium">Розмір</p>
          <div className="flex flex-wrap gap-2.5">
            {sizesForColor.map((variant) => (
              <button
                key={variant.size}
                type="button"
                disabled={variant.stock === 0}
                onClick={() => setSelectedSize(variant.size)}
                className={cn(
                  "flex h-11 min-w-11 items-center justify-center whitespace-nowrap rounded-card border px-3 text-sm font-bold transition",
                  variant.stock === 0
                    ? "cursor-not-allowed border-ink/10 text-ink/25 line-through"
                    : selectedSize === variant.size
                    ? "border-accent bg-accent text-white"
                    : "border-ink/15 text-ink/70 hover:border-accent/50"
                )}
              >
                {variant.size}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button
        variant="primary"
        onClick={handleAddToCart}
        disabled={!inStock}
        className="mt-8 w-full"
      >
        {inStock ? "Додати в кошик" : "Немає в наявності"}
      </Button>
    </div>
  );
}
