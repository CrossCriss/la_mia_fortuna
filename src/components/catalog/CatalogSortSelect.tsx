"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CATALOG_SORTS, SORT_LABELS, parseSort } from "@/lib/catalog-params";

export function CatalogSortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = parseSort(searchParams.get("sort") ?? undefined);

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "default") params.delete("sort");
    else params.set("sort", value);
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <label className="flex items-center gap-2 text-[15px] text-ink-soft">
      <span>Сортування</span>
      <select
        value={current}
        onChange={handleChange}
        className="min-h-11 border border-border bg-surface px-3 text-sm text-ink transition-colors duration-150 ease-out focus:border-accent focus:outline-none"
      >
        {CATALOG_SORTS.map((sort) => (
          <option key={sort} value={sort}>
            {SORT_LABELS[sort]}
          </option>
        ))}
      </select>
    </label>
  );
}
