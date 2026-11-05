import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format-price";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  NEW: "Новий",
  CONFIRMED: "Підтверджено",
  SHIPPED: "Відправлено",
  DELIVERED: "Доставлено",
  CANCELED: "Скасовано",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    date
  );
}

export default async function AccountOrdersPage() {
  const session = await getServerSession(authOptions);
  const orders = await prisma.order.findMany({
    where: { userId: session!.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Історія замовлень</h1>

      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">У вас ще немає замовлень.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border bg-surface p-4 transition hover:border-accent"
              >
                <div>
                  <p className="font-semibold text-ink">{order.orderNumber}</p>
                  <p className="text-sm text-ink-soft">
                    {formatDate(order.createdAt)} · {order.items.length} товар(ів)
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">{formatPrice(Number(order.total))}</p>
                  <p className="text-sm text-ink-soft">{STATUS_LABELS[order.status]}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
