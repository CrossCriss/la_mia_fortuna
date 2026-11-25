import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Розмірна сітка",
  alternates: { canonical: "/size-guide" },
};

export default function SizeGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-[36px] font-semibold text-ink">Розмірна сітка</h1>

      <div className="space-y-6 text-sm leading-relaxed text-ink-soft">
        <section>
          <h2 className="mb-2 font-semibold text-ink">Як визначити свій розмір</h2>
          <p className="font-medium">Правильне вимірювання - запорука зручного взуття.</p>

          <h3 className="mb-2 mt-4 font-medium text-ink">Що потрібно:</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>Аркуш паперу формату А4.</li>
            <li>Олівець або ручка.</li>
            <li>Сантиметрова стрічка або лінійка.</li>
          </ul>

          <h3 className="mb-2 mt-4 font-medium text-ink">Як правильно поміряти</h3>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <strong className="font-medium text-ink">Підготуйте все необхідне.</strong> Покладіть
              аркуш паперу на рівну тверду поверхню та притисніть його до стіни.
            </li>
            <li>
              <strong className="font-medium text-ink">Встаньте правильно.</strong> Встаньте на
              аркуш так, щоб п&apos;ята щільно торкалася стіни. Розподіліть вагу тіла рівномірно на
              обидві ноги.
            </li>
            <li>
              <strong className="font-medium text-ink">Обведіть стопу.</strong> Тримайте олівець
              рівно та обведіть стопу по контуру. Олівець має бути перпендикулярно до паперу.
            </li>
            <li>
              <strong className="font-medium text-ink">Виміряйте довжину.</strong> Виміряйте
              відстань від найдовшої точки п&apos;яти до найдовшої точки пальців. Це і є довжина
              вашої стопи.
            </li>
            <li>
              <strong className="font-medium text-ink">Виміряйте обидві стопи.</strong> Повторіть
              вимірювання для іншої стопи. Обирайте розмір взуття за більшою довжиною.
            </li>
          </ol>

          <h3 className="mb-2 mt-4 font-medium text-ink">Важливо</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>Вимірюйте стопу ввечері - в цей час вона найбільша.</li>
            <li>Вимірюйте в шкарпетках, які ви зазвичай носите із взуттям.</li>
            <li>Не округлюйте результат - вибирайте розмір точно за вимірами.</li>
          </ul>

          <p className="mt-4 font-medium">
            Пам&apos;ятайте: точне вимірювання - це ідеальна посадка взуття та комфорт на кожен день.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-ink">Таблиця розмірів</h2>
          <p>
            Розміри можуть відрізнятися залежно від моделі, тому таблиця розмірів для кожної моделі
            є в її картці товару - кнопка &quot;Таблиця розмірів&quot; біля вибору розміру.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-ink">Не впевнені з розміром?</h2>
          <p>
            Напишіть нам у Viber, Telegram чи Instagram довжину стопи в сантиметрах - підкажемо
            розмір для конкретної моделі.
          </p>
        </section>
      </div>
    </div>
  );
}
