import type { Metadata } from "next";
import { CategoryGrid } from "@/components/catalog/CategoryGrid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Каталог",
  alternates: { canonical: "/catalog" },
};

// Каталог: список категорій верхнього рівня.
export default function CatalogPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-10">
      <h1 className="font-display text-[44px] font-semibold text-ink">Каталог</h1>
      <div className="mt-8">
        <CategoryGrid />
      </div>
    </div>
  );
}
