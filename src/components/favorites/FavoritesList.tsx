"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { useFavoritesStore } from "@/lib/favorites-store";
import { useProductsByIds } from "@/lib/use-products-by-ids";
import { useHydrated } from "@/lib/use-hydrated";

function Skeleton() {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:gap-8" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-border/60" />
      ))}
    </div>
  );
}

export function FavoritesList() {
  const hydrated = useHydrated();
  const ids = useFavoritesStore((state) => state.ids);
  const prune = useFavoritesStore((state) => state.prune);

  // Знімок id на момент гідратації: запит до API робиться один раз, а
  // зняття сердечка просто ховає картку без повторного запиту й миготіння.
  const [snapshot, setSnapshot] = useState<string[] | null>(null);
  useEffect(() => {
    if (hydrated && snapshot === null) setSnapshot(useFavoritesStore.getState().ids);
  }, [hydrated, snapshot]);

  const { status, products, missingIds } = useProductsByIds(snapshot ?? [], snapshot !== null);

  const missingKey = missingIds.join(",");
  useEffect(() => {
    if (status !== "ready" || missingKey === "") return;
    const missing = new Set(missingKey.split(","));
    prune(useFavoritesStore.getState().ids.filter((id) => !missing.has(id)));
  }, [status, missingKey, prune]);

  if (!hydrated || snapshot === null) return <Skeleton />;

  if (ids.length === 0) {
    return (
      <div className="py-6">
        <p className="text-ink-soft">
          Тут поки порожньо. Натисніть на сердечко на товарі, щоб зберегти його.
        </p>
        <Link
          href="/catalog"
          className="mt-4 inline-block text-sm font-semibold text-accent-dark underline"
        >
          До каталогу
        </Link>
      </div>
    );
  }

  if (status === "error") {
    return <p className="text-ink-soft">Не вдалося завантажити товари. Оновіть сторінку.</p>;
  }

  if (status !== "ready") return <Skeleton />;

  const byId = new Map(products.map((product) => [product.id, product]));
  const visible = ids.flatMap((id) => byId.get(id) ?? []);
  return <ProductGrid products={visible} />;
}
