import { notFound } from "next/navigation";
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

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  LIQPAY: "LiqPay",
  CASH_ON_DELIVERY: "Накладений платіж",
};

export default async function AccountOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true },
  });

  if (!order || order.userId !== session!.user.id) notFound();

  return (
    <div>
      <Link href="/account/orders" className="text-sm text-accent underline">
        ← До всіх замовлень
      </Link>

      <h1 className="mt-3 font-display text-2xl font-bold text-ink">Замовлення {order.orderNumber}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {STATUS_LABELS[order.status]} · {PAYMENT_METHOD_LABELS[order.paymentMethod]}
        {order.trackingNumber ? ` · ТТН ${order.trackingNumber}` : ""}
      </p>

      <div className="mt-6 rounded-card border border-border bg-surface p-4">
        <table className="w-full text-left text-sm">
          <thead className="text-ink-soft">
            <tr>
              <th className="pb-2 font-medium">Товар</th>
              <th className="pb-2 font-medium">Розмір/колір</th>
              <th className="pb-2 font-medium">К-сть</th>
              <th className="pb-2 font-medium">Сума</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="py-2 text-ink">
                  {item.productName} <span className="text-ink-soft">({item.sku})</span>
                </td>
                <td className="py-2 text-ink-soft">
                  {item.size} / {item.color}
                </td>
                <td className="py-2 text-ink-soft">{item.quantity}</td>
                <td className="py-2 text-ink">{formatPrice(Number(item.total))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 space-y-1 border-t border-border pt-3 text-right text-sm">
          <p className="text-ink-soft">Проміжна сума: {formatPrice(Number(order.subtotal))}</p>
          {Number(order.discountTotal) > 0 && (
            <p className="text-accent">Знижка: −{formatPrice(Number(order.discountTotal))}</p>
          )}
          <p className="font-semibold text-ink">Разом: {formatPrice(Number(order.total))}</p>
        </div>
      </div>

      <div className="mt-4 rounded-card border border-border bg-surface p-4 text-sm">
        <h2 className="mb-2 font-semibold text-ink">Доставка</h2>
        <p className="text-ink-soft">{order.customerName}, {order.phone}</p>
        <p className="text-ink-soft">
          {order.shippingCity ?? "—"}, {order.shippingWarehouse ?? "—"}
        </p>
      </div>
    </div>
  );
}
