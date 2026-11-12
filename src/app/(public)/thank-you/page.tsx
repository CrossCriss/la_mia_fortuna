import Link from "next/link";
import { getPublicOrderSummary } from "@/lib/orders/public-order";
import type { PublicOrderSummary } from "@/lib/orders/public-order";
import { formatPrice } from "@/lib/format-price";
import { SITE } from "@/lib/site-config";

// Статус замовлення читається з БД при кожному відкритті (плюс звірка оплати Monobank).
export const dynamic = "force-dynamic";

const MAX_ORDER_NUMBER_LENGTH = 40;

function normalizeOrderNumber(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_ORDER_NUMBER_LENGTH) return null;
  return trimmed;
}

function statusMessage(summary: PublicOrderSummary): { text: string; needsHelp: boolean } {
  if (summary.paymentKind === "COD") {
    return { text: "Замовлення прийнято, ми зв'яжемось з вами для підтвердження", needsHelp: false };
  }
  switch (summary.paymentStatus) {
    case "PAID":
      return { text: "Оплату отримано", needsHelp: false };
    case "PENDING":
      return {
        text: "Очікуємо підтвердження оплати. Якщо ви вже оплатили, статус оновиться за кілька хвилин",
        needsHelp: false,
      };
    default:
      // FAILED і REFUNDED: без обіцянок, лише запрошення написати нам.
      return {
        text: "Оплата не пройшла. Напишіть нам, і ми допоможемо завершити замовлення",
        needsHelp: true,
      };
  }
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: { order?: string | string[] };
}) {
  const orderNumber = normalizeOrderNumber(searchParams.order);

  let summary: PublicOrderSummary | null = null;
  if (orderNumber) {
    try {
      summary = await getPublicOrderSummary(orderNumber);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      console.error(`Не вдалось завантажити замовлення ${orderNumber}: ${message}`);
    }
  }

  if (!summary) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold md:text-3xl">Дякуємо за замовлення!</h1>
        <p className="mt-4 text-neutral-600">
          Номер замовлення: <span className="font-medium text-neutral-900">{orderNumber ?? "-"}</span>
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          Номер ТТН з&apos;явиться тут після відправлення замовлення. Ми зв&apos;яжемось з вами для підтвердження.
        </p>
        <Link href="/" className="mt-8 inline-block text-sm text-accent underline">
          Повернутися до каталогу
        </Link>
      </div>
    );
  }

  const { text, needsHelp } = statusMessage(summary);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold md:text-3xl">Дякуємо за замовлення!</h1>
      <p className="mt-4 text-neutral-600">
        Номер замовлення: <span className="font-medium text-neutral-900">{summary.orderNumber}</span>
      </p>
      <p className="mt-2 text-sm text-neutral-700" role="status">
        {text}
      </p>

      {needsHelp && (
        <p className="mt-3 text-sm text-neutral-600">
          <a href={SITE.telegramUrl} className="text-accent underline" target="_blank" rel="noopener noreferrer">
            Telegram
          </a>
          {" · "}
          <a href={SITE.phoneHref} className="text-accent underline">
            {SITE.phoneDisplay}
          </a>
        </p>
      )}

      <ul className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200 text-left text-sm">
        {summary.items.map((item, index) => (
          <li key={`${item.id}-${index}`} className="flex justify-between gap-4 py-3">
            <span className="text-neutral-800">
              {item.name} <span className="text-neutral-500">x {item.quantity}</span>
            </span>
            <span className="whitespace-nowrap text-neutral-900">{formatPrice(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex justify-between text-left text-sm font-medium text-neutral-900">
        <span>Разом</span>
        <span>{formatPrice(summary.total)}</span>
      </p>

      {summary.trackingNumber ? (
        <p className="mt-4 text-sm text-neutral-600">
          Номер ТТН: <span className="font-medium text-neutral-900">{summary.trackingNumber}</span>
        </p>
      ) : (
        <p className="mt-4 text-sm text-neutral-500">
          Номер ТТН з&apos;явиться тут після відправлення замовлення.
        </p>
      )}

      <Link href="/" className="mt-8 inline-block text-sm text-accent underline">
        Повернутися до каталогу
      </Link>
    </div>
  );
}
