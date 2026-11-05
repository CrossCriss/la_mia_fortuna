import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format-price";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  NEW: "Новий",
  CONFIRMED: "Підтверджено",
  SHIPPED: "Відправлено",
  DELIVERED: "Доставлено",
  CANCELED: "Скасовано",
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  NEW: "bg-neutral-100 text-neutral-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELED: "bg-red-100 text-red-700",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  LIQPAY: "LiqPay",
  MONOBANK: "Monobank",
  CASH_ON_DELIVERY: "Накладений платіж",
};

const STATUS_VALUES = ["NEW", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELED"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status && STATUS_VALUES.includes(searchParams.status)
    ? searchParams.status
    : undefined;

  const orders = await prisma.order.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Замовлення</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterLink label="Усі" href="/admin/orders" active={!status} />
        {STATUS_VALUES.map((value) => (
          <FilterLink
            key={value}
            label={STATUS_LABELS[value]}
            href={`/admin/orders?status=${value}`}
            active={status === value}
          />
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">№</th>
              <th className="px-4 py-2 font-medium">Клієнт</th>
              <th className="px-4 py-2 font-medium">Телефон</th>
              <th className="px-4 py-2 font-medium">Оплата</th>
              <th className="px-4 py-2 font-medium">Сума</th>
              <th className="px-4 py-2 font-medium">Статус</th>
              <th className="px-4 py-2 font-medium">Дата</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-2 font-medium text-neutral-900">{order.orderNumber}</td>
                <td className="px-4 py-2 text-neutral-600">{order.customerName}</td>
                <td className="px-4 py-2 text-neutral-500">{order.phone}</td>
                <td className="px-4 py-2 text-neutral-500">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                </td>
                <td className="px-4 py-2 text-neutral-900">{formatPrice(Number(order.total))}</td>
                <td className="px-4 py-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_BADGE_STYLES[order.status]
                    )}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td className="px-4 py-2 text-neutral-500">
                  {new Intl.DateTimeFormat("uk-UA", { dateStyle: "short", timeStyle: "short" }).format(
                    order.createdAt
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-sm text-neutral-600 hover:underline"
                  >
                    Деталі
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-neutral-400">
                  Замовлень ще немає.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-sm",
        active
          ? "border-neutral-900 bg-neutral-900 text-white"
          : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
      )}
    >
      {label}
    </Link>
  );
}
