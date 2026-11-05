"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format-price";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/cart-store";
import { isRealSizeName } from "@/lib/color-print";
import type { Variant } from "@/components/product/ProductOptions";
import type { HomeBadge } from "@/lib/home-badges";

type ProductCardProps = {
  slug: string;
  name: string;
  price: number;
  discountPrice?: number | null;
  image?: string;
  secondaryImage?: string;
  isNew?: boolean;
  isPromo?: boolean;
  variants?: Variant[];
  // Переопределяє isNew/isPromo бейджі — використовується секціями-підбірками
  // на головній (Топ продажів/Новинка за датою/Останні одиниці, див. home-badges.ts).
  badges?: HomeBadge[];
};

export function ProductCard({
  slug,
  name,
  price,
  discountPrice,
  image,
  secondaryImage,
  isNew,
  isPromo,
  variants = [],
  badges,
}: ProductCardProps) {
  const hasDiscount = discountPrice != null && discountPrice < price;
  const addItem = useCartStore((state) => state.addItem);

  // Розміри статично показуються під ціною (не по ховеру на фото). Картка
  // не пропонує вибір кольору — серед кольорів одного розміру береться
  // варіант з найбільшим залишком; повний вибір кольору лишається на
  // сторінці товару (ProductOptions).
  const sizeOptions = useMemo(() => {
    const bySize = new Map<string, Variant>();
    variants.forEach((variant) => {
      if (!isRealSizeName(variant.size)) return;
      const current = bySize.get(variant.size);
      if (!current || variant.stock > current.stock) {
        bySize.set(variant.size, variant);
      }
    });
    return Array.from(bySize.values());
  }, [variants]);

  const hasSizeOptions = sizeOptions.length > 0;
  const firstInStock = useMemo(
    () => sizeOptions.find((variant) => variant.stock > 0),
    [sizeOptions]
  );

  const [selectedSize, setSelectedSize] = useState<string | null>(firstInStock?.size ?? null);
  const [sizeError, setSizeError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const activeVariant = hasSizeOptions
    ? sizeOptions.find((variant) => variant.size === selectedSize)
    : variants[0];

  function handleSizeSelect(event: React.MouseEvent, size: string) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedSize(size);
    setSizeError(false);
  }

  function handleAddToCart(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (justAdded) return;

    if (hasSizeOptions && !selectedSize) {
      setSizeError(true);
      return;
    }
    if (!activeVariant || activeVariant.stock < 1) return;

    addItem({
      variantId: activeVariant.id,
      productSlug: slug,
      name,
      size: activeVariant.size,
      color: activeVariant.color,
      price: discountPrice ?? price,
      quantity: 1,
      image,
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <Link href={`/product/${slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary/25">
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            decoding="async"
            className={cn(
              "h-full w-full object-cover transition duration-300 ease-out group-hover:scale-105",
              secondaryImage && "group-hover:opacity-0"
            )}
          />
        ) : (
          <PlaceholderImage />
        )}
        {secondaryImage && (
          <img
            src={secondaryImage}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-300 ease-out group-hover:opacity-100 group-hover:scale-105"
          />
        )}
        {badges && badges.length > 0 ? (
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {badges.map((badge) => (
              <Badge key={badge.label} variant={badge.variant}>
                {badge.label}
              </Badge>
            ))}
          </div>
        ) : (
          (isNew || isPromo) && (
            <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
              {isNew && <Badge variant="new">Новинка</Badge>}
              {isPromo && <Badge variant="sale">Акція</Badge>}
            </div>
          )
        )}
      </div>

      <div className="mt-2.5 space-y-1.5">
        <p className="line-clamp-2 text-sm font-bold text-ink">{name}</p>
        <div className="flex items-baseline gap-2">
          {hasDiscount ? (
            <>
              <span className="text-[15px] font-extrabold text-ink">{formatPrice(discountPrice!)}</span>
              <span className="text-xs text-ink-soft line-through">{formatPrice(price)}</span>
            </>
          ) : (
            <span className="text-[15px] font-extrabold text-ink">{formatPrice(price)}</span>
          )}
        </div>

        {hasSizeOptions && (
          <div className="flex flex-wrap gap-1">
            {sizeOptions.map((variant) => (
              <button
                key={variant.size}
                type="button"
                disabled={variant.stock === 0}
                onClick={(event) => handleSizeSelect(event, variant.size)}
                className={cn(
                  "flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-[11px] font-bold transition",
                  variant.stock === 0
                    ? "cursor-not-allowed border-border text-ink-soft/40 line-through"
                    : selectedSize === variant.size
                    ? "border-accent bg-accent text-white"
                    : sizeError
                    ? "border-red-400 text-red-600"
                    : "border-border text-ink-soft hover:border-ink/40"
                )}
              >
                {variant.size}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleAddToCart}
          className="mt-1 w-full rounded-full bg-accent py-2 text-xs font-bold text-white transition duration-150 ease-out hover:bg-accent-dark"
        >
          {justAdded ? "Додано ✓" : "Додати в кошик"}
        </button>
      </div>
    </Link>
  );
}
