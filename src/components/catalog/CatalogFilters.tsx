"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function CatalogFilters({
  subcategories = [],
  sizes,
  colors = [],
  prints,
}: {
  subcategories?: { slug: string; name: string }[];
  sizes: string[];
  colors?: { name: string; hex: string }[];
  prints: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpenOnMobile, setIsOpenOnMobile] = useState(false);

  const selectedCategories = new Set((searchParams.get("category") ?? "").split(",").filter(Boolean));
  const selectedSizes = new Set((searchParams.get("size") ?? "").split(",").filter(Boolean));
  const selectedColors = new Set((searchParams.get("color") ?? "").split(",").filter(Boolean));
  const selectedPrints = new Set((searchParams.get("print") ?? "").split(",").filter(Boolean));
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const hasActiveFilters =
    selectedCategories.size > 0 ||
    selectedSizes.size > 0 ||
    selectedColors.size > 0 ||
    selectedPrints.size > 0 ||
    minPrice ||
    maxPrice;
  const activeCount =
    selectedCategories.size +
    selectedSizes.size +
    selectedColors.size +
    selectedPrints.size +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0);

  function pushParams(params: URLSearchParams) {
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function toggleValue(key: "category" | "size" | "color" | "print", value: string, current: Set<string>) {
    const next = new Set(current);
    if (next.has(value)) next.delete(value);
    else next.add(value);

    const params = new URLSearchParams(searchParams.toString());
    if (next.size) params.set(key, Array.from(next).join(","));
    else params.delete(key);
    params.delete("page");
    pushParams(params);
  }

  function handlePriceSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const min = (formData.get("minPrice") as string)?.trim();
    const max = (formData.get("maxPrice") as string)?.trim();

    const params = new URLSearchParams(searchParams.toString());
    min ? params.set("minPrice", min) : params.delete("minPrice");
    max ? params.set("maxPrice", max) : params.delete("maxPrice");
    params.delete("page");
    pushParams(params);
  }

  function resetFilters() {
    router.push(pathname);
  }

  return (
    <aside className="w-full shrink-0 md:w-60">
      <button
        type="button"
        onClick={() => setIsOpenOnMobile((prev) => !prev)}
        className="mb-4 flex w-full items-center justify-between border border-border px-4 py-2 text-sm font-medium md:hidden"
      >
        <span>Фільтри{activeCount > 0 ? ` (${activeCount})` : ""}</span>
        <span aria-hidden>{isOpenOnMobile ? "▲" : "▼"}</span>
      </button>

      <div className={cn(isOpenOnMobile ? "block" : "hidden", "md:block")}>
        {subcategories.length > 0 && (
          <div className="mb-8">
            <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink">Категорія</p>
            <div className="flex flex-col gap-2.5">
              {subcategories.map((subcategory) => (
                <label key={subcategory.slug} className="flex items-center gap-2.5 text-[15px] text-ink">
                  <input
                    type="checkbox"
                    checked={selectedCategories.has(subcategory.slug)}
                    onChange={() => toggleValue("category", subcategory.slug, selectedCategories)}
                    className="h-[18px] w-[18px] accent-accent"
                  />
                  <span>{subcategory.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {sizes.length > 0 && (
          <div className="mb-8">
            <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink">Розмір</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleValue("size", size, selectedSizes)}
                  className={cn(
                    "flex min-h-11 min-w-11 items-center justify-center border text-sm font-semibold transition duration-150 ease-out",
                    selectedSizes.has(size)
                      ? "border-ink bg-ink text-background"
                      : "border-border bg-surface text-ink hover:border-accent/50"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {colors.length > 0 && (
          <div className="mb-8">
            <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink">Колір</p>
            <div className="flex flex-col gap-2.5">
              {colors.map((color) => (
                <label key={color.name} className="flex items-center gap-2.5 text-[15px] text-ink">
                  <input
                    type="checkbox"
                    checked={selectedColors.has(color.name)}
                    onChange={() => toggleValue("color", color.name, selectedColors)}
                    className="h-[18px] w-[18px] accent-accent"
                  />
                  <span
                    className="h-4 w-4 rounded-full border border-border"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span>{color.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {prints.length > 0 && (
          <div className="mb-8">
            <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink">Принт/Малюнок</p>
            <div className="flex flex-wrap gap-2">
              {prints.map((print) => (
                <button
                  key={print}
                  type="button"
                  onClick={() => toggleValue("print", print, selectedPrints)}
                  className={cn(
                    "border px-3 py-1.5 text-sm transition duration-150 ease-out",
                    selectedPrints.has(print)
                      ? "border-ink bg-ink text-background"
                      : "border-border text-ink hover:border-accent/50"
                  )}
                >
                  {print}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink">Ціна, грн</p>
          <form onSubmit={handlePriceSubmit} className="flex items-center gap-2">
            <input
              name="minPrice"
              defaultValue={minPrice}
              placeholder="від 2 300"
              inputMode="numeric"
              className="min-h-11 w-full min-w-0 border border-border bg-surface px-3 text-sm transition-colors duration-150 ease-out focus:border-accent focus:outline-none"
            />
            <input
              name="maxPrice"
              defaultValue={maxPrice}
              placeholder="до 2 900"
              inputMode="numeric"
              className="min-h-11 w-full min-w-0 border border-border bg-surface px-3 text-sm transition-colors duration-150 ease-out focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              className="min-h-11 shrink-0 bg-ink px-3 text-sm font-semibold text-background transition duration-150 ease-out hover:bg-accent-dark"
            >
              OK
            </button>
          </form>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm text-ink-soft underline transition-colors duration-150 ease-out hover:text-ink"
          >
            Скинути фільтри
          </button>
        )}
      </div>
    </aside>
  );
}
