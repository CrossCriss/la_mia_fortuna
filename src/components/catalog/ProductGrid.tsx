import { ProductCard } from "./ProductCard";
import type { Variant } from "@/components/product/ProductOptions";
import type { HomeBadge } from "@/lib/home-badges";

export type GridProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  discountPrice: number | null;
  isNew?: boolean;
  isPromo?: boolean;
  images: { url: string }[];
  variants?: Variant[];
  badges?: HomeBadge[];
};

export function ProductGrid({
  products,
  emptyMessage = "Поки немає товарів.",
}: {
  products: GridProduct[];
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return <p className="text-sm text-neutral-500">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 lg:gap-8">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          slug={product.slug}
          name={product.name}
          price={product.price}
          discountPrice={product.discountPrice}
          isNew={product.isNew}
          isPromo={product.isPromo}
          image={product.images[0]?.url}
          secondaryImage={product.images[1]?.url}
          variants={product.variants}
          badges={product.badges}
        />
      ))}
    </div>
  );
}
