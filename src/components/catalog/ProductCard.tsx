"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format-price";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { QuickAddOverlay } from "./QuickAddOverlay";
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
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <Link
      href={`/product/${slug}`}
      className="group block"
      onMouseEnter={() => setQuickAddOpen(true)}
      onMouseLeave={() => setQuickAddOpen(false)}
    >
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
        {variants.length > 0 && (
          <QuickAddOverlay
            productSlug={slug}
            productName={name}
            price={price}
            discountPrice={discountPrice}
            image={image}
            variants={variants}
            open={quickAddOpen}
            onOpenChange={setQuickAddOpen}
          />
        )}
      </div>
      <div className="mt-2.5 space-y-0.5">
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
      </div>
    </Link>
  );
}
