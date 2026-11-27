"use client";

import { useEffect, useMemo, useRef } from "react";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { useRecentlyViewedStore } from "@/lib/recently-viewed-store";
import { useProductsByIds } from "@/lib/use-products-by-ids";
import { useHydrated } from "@/lib/use-hydrated";

export function TrackRecentlyViewed({ productId }: { productId: string }) {
  const add = useRecentlyViewedStore((state) => state.add);
  useEffect(() => {
    add(productId);
  }, [add, productId]);
  return null;
}

export function RecentlyViewedSection({
  excludeId,
  limit,
}: {
  excludeId?: string;
  limit: number;
}) {
  const hydrated = useHydrated();
  const storeIds = useRecentlyViewedStore((state) => state.ids);
  const prune = useRecentlyViewedStore((state) => state.prune);

  const ids = useMemo(
    () => storeIds.filter((id) => id !== excludeId).slice(0, limit),
    [storeIds, excludeId, limit],
  );

  const { status, products, missingIds } = useProductsByIds(ids, hydrated);

  // Один раз на відповідь: прибираємо з історії товари, яких вже немає.
  const prunedKey = useRef("");
  const missingKey = missingIds.join(",");
  useEffect(() => {
    if (status !== "ready" || missingKey === "") return;
    const key = `${ids.join(",")}|${missingKey}`;
    if (prunedKey.current === key) return;
    prunedKey.current = key;
    const missing = new Set(missingKey.split(","));
    prune(storeIds.filter((id) => !missing.has(id)));
  }, [status, missingKey, ids, storeIds, prune]);

  if (!hydrated || status !== "ready" || products.length === 0) return null;

  return (
    <section className="mt-20">
      <h2 className="font-display text-[32px] font-semibold text-ink md:text-[44px]">
        Ви нещодавно переглядали
      </h2>
      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
