import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminProductsTable } from "@/components/admin/AdminProductsTable";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true, variants: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    categoryName: product.category.name,
    price: Number(product.price),
    discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
    totalStock: product.variants.reduce((sum, v) => sum + v.stock, 0),
    variantsCount: product.variants.length,
    isPublished: product.isPublished,
    showOnHomepage: product.showOnHomepage,
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Товари</h1>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          + Новий товар
        </Link>
      </div>

      <AdminProductsTable products={rows} />
    </div>
  );
}
