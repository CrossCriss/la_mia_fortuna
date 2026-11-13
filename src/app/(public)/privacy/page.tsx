import type { Metadata } from "next";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Політика конфіденційності",
  alternates: { canonical: "/privacy" },
};

// ТИМЧАСОВИЙ ТЕКСТ (чернетка) для демонстрації клієнтці.
// Обов'язкова для прийому платежів і реклами в Google/Meta (ТЗ §4) — перед
// публікацією потрібна перевірка юристом на відповідність законодавству
// про захист персональних даних.
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-[36px] font-semibold text-ink">Політика конфіденційності</h1>
      <PlaceholderNotice />
      <p className="mb-6 text-sm text-amber-800">
        Це чернетка — перед публікацією рекомендуємо перевірку юристом, особливо в частині
        відповідності законодавству про захист персональних даних.
      </p>

      <div className="space-y-6 text-sm leading-relaxed text-neutral-700">
        <section>
          <h2 className="mb-2 font-semibold text-neutral-900">Які дані ми збираємо</h2>
          <p>
            Ім&apos;я, номер телефону, email (за бажанням), місто та відділення Нової Пошти —
            виключно для оформлення й доставки замовлення.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900">Як ми використовуємо дані</h2>
          <p>Для зв&apos;язку щодо замовлення, доставки та (за згодою) для розсилки новин.</p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900">Кому передаються дані</h2>
          <p>
            Службі доставки (Нова Пошта) та платіжній системі — виключно в обсязі, необхідному
            для виконання замовлення.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900">Файли cookie</h2>
          <p>
            Сайт використовує cookie для роботи кошика та аналітики (Google Analytics, Meta
            Pixel).
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900">Ваші права</h2>
          <p>
            Ви можете запросити видалення своїх персональних даних, написавши нам у Telegram або
            Viber: {SITE.phoneDisplay}.
          </p>
        </section>
      </div>
    </div>
  );
}
