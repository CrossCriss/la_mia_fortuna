"use client";

import { useFavoritesStore } from "@/lib/favorites-store";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  productId: string;
  productName: string;
  variant: "card" | "page";
};

function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      className={cn(filled ? "fill-accent text-accent" : "fill-none text-ink", className)}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20.5s-7.5-4.6-9.4-9.2C1.2 7.9 3.1 4.5 6.6 4.5c2 0 3.5 1.1 5.4 3.1 1.9-2 3.4-3.1 5.4-3.1 3.5 0 5.4 3.4 4 6.8-1.9 4.6-9.4 9.2-9.4 9.2z" />
    </svg>
  );
}

export function FavoriteButton({ productId, productName, variant }: FavoriteButtonProps) {
  const hydrated = useHydrated();
  const isFavorite = useFavoritesStore((state) => state.ids.includes(productId));
  const toggle = useFavoritesStore((state) => state.toggle);
  const active = hydrated && isFavorite;

  function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    toggle(productId);
  }

  const label = active
    ? `Прибрати з обраного: ${productName}`
    : `Додати в обране: ${productName}`;

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={active}
        aria-label={label}
        className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 transition hover:bg-white">
          <HeartIcon filled={active} />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={label}
      className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 border border-border text-[15px] font-bold text-ink transition hover:border-ink"
    >
      <HeartIcon filled={active} />
      {active ? "В обраному" : "В обране"}
    </button>
  );
}
