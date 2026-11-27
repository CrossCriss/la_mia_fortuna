import type { Metadata } from "next";
import { FavoritesList } from "@/components/favorites/FavoritesList";

export const metadata: Metadata = {
  title: "Обране",
  robots: { index: false },
};

export default function FavoritesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-10">
      <div className="border-b border-border pb-6">
        <h1 className="font-display text-[44px] font-semibold leading-[1.02] text-ink md:text-[56px]">
          Обране
        </h1>
      </div>
      <div className="mt-8">
        <FavoritesList />
      </div>
    </div>
  );
}
