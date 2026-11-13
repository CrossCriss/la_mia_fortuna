import Link from "next/link";
import type { Metadata } from "next";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Публічна оферта",
  alternates: { canonical: "/oferta" },
};

const EMPTY = "[буде додано]";

// ТИМЧАСОВИЙ ТЕКСТ (чернетка) для демонстрації клієнтці.
// Фінальний текст оферти надає клієнтка; перед публікацією потрібна перевірка
// юристом на відповідність законодавству про електронну комерцію та захист
// прав споживачів.
export default function OfertaPage() {
  const seller = SITE.seller;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-[36px] font-semibold text-ink">Публічна оферта</h1>
      <PlaceholderNotice />
      <p className="mb-6 text-sm text-amber-800">
        Це чернетка - перед публікацією рекомендуємо перевірку юристом.
      </p>

      <div className="space-y-6 text-sm leading-relaxed text-neutral-700">
        <section>
          <h2 className="mb-2 font-semibold text-neutral-900">Загальні положення</h2>
          <p>
            Цей документ є публічною пропозицією (офертою) продавця укласти договір купівлі-продажу
            товарів, представлених на сайті. Оформлення замовлення означає повну й безумовну
            згоду покупця з умовами цієї оферти.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900">Предмет договору</h2>
          <p>
            Продавець передає у власність покупця товар (жіноче взуття) відповідно до замовлення,
            а покупець зобов&apos;язується прийняти товар і оплатити його на умовах цієї оферти.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900">Оформлення замовлення</h2>
          <p>
            Замовлення оформлюється на сайті через кошик і форму оформлення. Покупець вказує
            достовірні контактні дані та дані для доставки. Продавець може зв&apos;язатися з
            покупцем для уточнення деталей замовлення.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900">Ціна та оплата</h2>
          <p>
            Ціни на товари вказані на сайті в гривнях. Оплата здійснюється карткою онлайн або
            накладеним платежем при отриманні. Продавець залишає за собою право змінювати ціни;
            для оформленого замовлення діє ціна на момент його оформлення.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900">Доставка</h2>
          <p>
            Доставка здійснюється службою доставки (Нова Пошта) у відділення, обране покупцем.
            Строки та вартість доставки залежать від умов служби доставки. Докладніше - на
            сторінці <Link href="/delivery" className="underline">Умови замовлення</Link>.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900">Повернення та обмін (14 днів)</h2>
          <p>
            Покупець має право повернути або обміняти товар належної якості протягом 14 днів з
            моменту отримання, якщо товар не було у використанні, збережено товарний вигляд,
            споживчі властивості та упаковку. Докладніше - на сторінці{" "}
            <Link href="/returns" className="underline">Повернення/обмін</Link>.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900">Відповідальність сторін</h2>
          <p>
            Сторони несуть відповідальність за невиконання або неналежне виконання своїх
            зобов&apos;язань відповідно до чинного законодавства України. Сторони звільняються
            від відповідальності у разі настання обставин непереборної сили.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900">Персональні дані</h2>
          <p>
            Оформлюючи замовлення, покупець надає дані, необхідні для виконання замовлення.
            Порядок обробки персональних даних описано в{" "}
            <Link href="/privacy" className="underline">політиці конфіденційності</Link>.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900">Реквізити продавця</h2>
          <dl className="space-y-1">
            <div>
              <dt className="inline font-medium text-neutral-900">Найменування: </dt>
              <dd className="inline">{seller.legalName || EMPTY}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-neutral-900">Податковий номер: </dt>
              <dd className="inline">{seller.taxId || EMPTY}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-neutral-900">Адреса: </dt>
              <dd className="inline">{seller.address || EMPTY}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-neutral-900">Email: </dt>
              <dd className="inline">{seller.email || EMPTY}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
