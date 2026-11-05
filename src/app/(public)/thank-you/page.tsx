import Link from "next/link";

// Сторінка "Дякуємо за замовлення" + номер замовлення.
// Номер ТТН з'явиться пізніше — після підключення Nova Poshta й фактичної відправки.
export default function ThankYouPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold md:text-3xl">Дякуємо за замовлення!</h1>
      <p className="mt-4 text-neutral-600">
        Номер замовлення: <span className="font-medium text-neutral-900">{searchParams.order ?? "—"}</span>
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
