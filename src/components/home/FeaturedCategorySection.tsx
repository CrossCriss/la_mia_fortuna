import Link from "next/link";
import { ProductGrid, type GridProduct } from "@/components/catalog/ProductGrid";

export function FeaturedCategorySection({
  name,
  slug,
  products,
}: {
  name: string;
  slug: string;
  products: GridProduct[];
}) {
  return (
    <section className="py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">
            {name}
          </span>
          <h2 className="font-display text-[32px] font-semibold leading-[1.05] text-ink md:text-[42px]">
            Обирають цього сезону
          </h2>
        </div>
        <Link href={`/catalog/${slug}`} className="border-b border-ink pb-0.5 font-semibold text-ink">
          Весь каталог
        </Link>
      </div>
      <div className="mt-8">
        <ProductGrid products={products} emptyMessage="Товари скоро з'являться." />
      </div>
    </section>
  );
}
