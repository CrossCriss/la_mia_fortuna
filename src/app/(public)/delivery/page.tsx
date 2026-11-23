import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Доставка та оплата",
  alternates: { canonical: "/delivery" },
};

export default function DeliveryPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-[36px] font-semibold text-ink">Доставка та оплата</h1>

      <div className="space-y-4 text-sm leading-relaxed text-ink-soft">
        <h2 className="pt-2 font-display text-[24px] font-semibold text-ink">Доставка</h2>
        <p>
          Доставляємо замовлення по всій Україні службою &quot;Нова Пошта&quot; у відділення або
          поштомат, який ви оберете під час оформлення замовлення.
        </p>
        <p>
          Після оформлення ми зв&apos;яжемося з вами, щоб підтвердити замовлення. Відправляємо
          протягом 1-2 робочих днів після підтвердження. Доставка Новою Поштою зазвичай займає 1-3
          дні залежно від міста.
        </p>
        <p>
          Після відправки ми надішлемо вам номер ТТН, за яким можна відстежити посилку в застосунку
          або на сайті Нової Пошти.
        </p>
        <p>
          Вартість доставки розраховується за тарифами Нової Пошти і сплачується при отриманні
          посилки окремо від вартості взуття.
        </p>

        <h2 className="pt-2 font-display text-[24px] font-semibold text-ink">Оплата</h2>
        <p>Під час оформлення замовлення доступні такі способи оплати:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium">Оплата карткою онлайн</span>: Visa або
            Mastercard. Платіж проходить на захищеній сторінці банку.
          </li>
          <li>
            <span className="font-medium">Накладений платіж</span>: оплата при отриманні
            у відділенні Нової Пошти. За цей спосіб Нова Пошта додатково стягує комісію за переказ
            коштів, її сплачує отримувач.
          </li>
        </ul>

        <h2 className="pt-2 font-display text-[24px] font-semibold text-ink">Отримання</h2>
        <p>
          Перед оплатою ви можете оглянути посилку у відділенні Нової Пошти. Якщо виникнуть питання
          щодо моделі чи розміру, напишіть нам у Viber або Telegram, ми з радістю допоможемо.
        </p>
      </div>
    </div>
  );
}
