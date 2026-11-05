import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format-price";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";

export const dynamic = "force-dynamic";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  LIQPAY: "LiqPay",
  MONOBANK: "Monobank",
  CASH_ON_DELIVERY: "Накладений платіж",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Очікує",
  PAID: "Оплачено",
  FAILED: "Помилка",
  REFUNDED: "Повернено",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true },
  });

  if (!order) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Замовлення {order.orderNumber}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-neutral-900">Клієнт і доставка</h2>
            <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
              <dt className="text-neutral-500">Ім&apos;я</dt>
              <dd>{order.customerName}</dd>
              <dt className="text-neutral-500">Телефон</dt>
              <dd>{order.phone}</dd>
              <dt className="text-neutral-500">Email</dt>
              <dd>{order.email ?? "—"}</dd>
              <dt className="text-neutral-500">Місто</dt>
              <dd>{order.shippingCity ?? "—"}</dd>
              <dt className="text-neutral-500">Відділення НП</dt>
              <dd>{order.shippingWarehouse ?? "—"}</dd>
              <dt className="text-neutral-500">Коментар</dt>
              <dd>{order.comment ?? "—"}</dd>
            </dl>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-neutral-900">Товари</h2>
            <table className="w-full text-left text-sm">
              <thead className="text-neutral-500">
                <tr>
                  <th className="pb-2 font-medium">Товар</th>
                  <th className="pb-2 font-medium">Розмір/колір</th>
                  <th className="pb-2 font-medium">К-сть</th>
                  <th className="pb-2 font-medium">Сума</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-t border-neutral-100">
                    <td className="py-2">
                      {item.productName} <span className="text-neutral-400">({item.sku})</span>
                    </td>
                    <td className="py-2 text-neutral-500">
                      {item.size} / {item.color}
                    </td>
                    <td className="py-2 text-neutral-500">{item.quantity}</td>
                    <td className="py-2">{formatPrice(Number(item.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 space-y-1 border-t border-neutral-100 pt-3 text-right text-sm">
              <p className="text-neutral-500">Проміжна сума: {formatPrice(Number(order.subtotal))}</p>
              {Number(order.discountTotal) > 0 && (
                <p className="text-neutral-500">Знижка: −{formatPrice(Number(order.discountTotal))}</p>
              )}
              {Number(order.shippingCost) > 0 && (
                <p className="text-neutral-500">Доставка: {formatPrice(Number(order.shippingCost))}</p>
              )}
              <p className="font-semibold text-neutral-900">Разом: {formatPrice(Number(order.total))}</p>
            </div>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-4 text-sm">
            <h2 className="mb-3 text-sm font-semibold text-neutral-900">Оплата</h2>
            <p>Спосіб: {PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
            <p>Статус оплати: {PAYMENT_STATUS_LABELS[order.paymentStatus]}</p>
          </section>
        </div>

        <OrderStatusControl
          orderId={order.id}
          currentStatus={order.status}
          currentPaymentStatus={order.paymentStatus}
          currentTrackingNumber={order.trackingNumber}
        />
      </div>
    </div>
  );
}
