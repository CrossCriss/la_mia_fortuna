"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ProductFeaturedToggle } from "@/components/admin/ProductFeaturedToggle";
import { formatPrice } from "@/lib/format-price";

export type AdminProductRow = {
  id: string;
  name: string;
  sku: string;
  categoryName: string;
  price: number;
  discountPrice: number | null;
  totalStock: number;
  variantsCount: number;
  isPublished: boolean;
  showOnHomepage: boolean;
};

export function AdminProductsTable({ products }: { products: AdminProductRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) => product.name.toLowerCase().includes(q));
  }, [products, query]);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Пошук за назвою товару…"
        className="mt-6 w-full max-w-sm rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
      />

      <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Назва</th>
              <th className="px-4 py-2 font-medium">Категорія</th>
              <th className="px-4 py-2 font-medium">Ціна</th>
              <th className="px-4 py-2 font-medium">Залишок</th>
              <th className="px-4 py-2 font-medium">Статус</th>
              <th className="px-4 py-2 font-medium">На головній</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-2 font-medium text-neutral-900">
                  {product.name}
                  <div className="text-xs font-normal text-neutral-400">{product.sku}</div>
                </td>
                <td className="px-4 py-2 text-neutral-500">{product.categoryName}</td>
                <td className="px-4 py-2 text-neutral-500">
                  {product.discountPrice ? (
                    <>
                      <span className="text-neutral-900">{formatPrice(product.discountPrice)}</span>{" "}
                      <span className="text-xs line-through">{formatPrice(product.price)}</span>
                    </>
                  ) : (
                    formatPrice(product.price)
                  )}
                </td>
                <td className="px-4 py-2 text-neutral-500">
                  {product.totalStock === 0 ? (
                    <span className="text-red-600">0</span>
                  ) : (
                    product.totalStock
                  )}
                  <span className="text-xs text-neutral-400"> ({product.variantsCount} вар.)</span>
                </td>
                <td className="px-4 py-2 text-neutral-500">
                  {product.isPublished ? "Опубліковано" : "Приховано"}
                </td>
                <td className="px-4 py-2 text-neutral-500">
                  <ProductFeaturedToggle
                    productId={product.id}
                    initialValue={product.showOnHomepage}
                  />
                </td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-4">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-sm text-neutral-600 hover:underline"
                    >
                      Редагувати
                    </Link>
                    <DeleteButton
                      url={`/api/admin/products/${product.id}`}
                      confirmMessage={`Видалити товар "${product.name}"?`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-neutral-400">
                  Товарів ще немає.
                </td>
              </tr>
            )}
            {products.length > 0 && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-neutral-400">
                  Товарів не знайдено за запитом «{query.trim()}».
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
