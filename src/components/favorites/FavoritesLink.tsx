"use client";

import Link from "next/link";
import { useFavoritesStore } from "@/lib/favorites-store";
import { useHydrated } from "@/lib/use-hydrated";

export function FavoritesLink() {
  const hydrated = useHydrated();
  const count = useFavoritesStore((state) => state.ids.length);

  return (
    <Link
      href="/favorites"
      aria-label="Обране"
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-ink/20 text-ink transition duration-150 ease-out hover:border-ink/40"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 20.5s-7.5-4.6-9.4-9.2C1.2 7.9 3.1 4.5 6.6 4.5c2 0 3.5 1.1 5.4 3.1 1.9-2 3.4-3.1 5.4-3.1 3.5 0 5.4 3.4 4 6.8-1.9 4.6-9.4 9.2-9.4 9.2z" />
      </svg>
      {hydrated && count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
