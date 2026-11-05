import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [productsCount, categoriesCount, newOrdersCount, ordersCount] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.count({ where: { status: "NEW" } }),
    prisma.order.count(),
  ]);

  const cards = [
    { label: "Товари", value: productsCount, href: "/admin/products" },
    { label: "Категорії", value: categoriesCount, href: "/admin/categories" },
    { label: "Нові замовлення", value: newOrdersCount, href: "/admin/orders?status=NEW" },
    { label: "Усього замовлень", value: ordersCount, href: "/admin/orders" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Огляд</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-300"
          >
            <p className="text-sm text-neutral-500">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold text-neutral-900">{card.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
