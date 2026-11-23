import type { Metadata } from "next";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";

export const metadata: Metadata = {
  title: "Розмірна сітка",
  alternates: { canonical: "/size-guide" },
};

// Орієнтовна таблиця (стандартне співвідношення EU-розміру і довжини стопи
// в см) - клієнтка просила розділ "Розмірна сітка" (запит від 2026-11-06),
// але точних вимірів для своїх моделей ще не надала. Замінити реальними
// даними, коли вона їх пришле.
const SIZE_ROWS = [
  { eu: "36", footLengthCm: "23" },
  { eu: "37", footLengthCm: "23.5" },
  { eu: "38", footLengthCm: "24.5" },
  { eu: "39", footLengthCm: "25" },
  { eu: "40", footLengthCm: "25.5" },
  { eu: "41", footLengthCm: "26.5" },
];

export default function SizeGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-[36px] font-semibold text-ink">Розмірна сітка</h1>
      <PlaceholderNotice />

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
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left">
              <thead className="bg-secondary/30 text-ink">
                <tr>
                  <th className="px-4 py-2 font-semibold">Розмір (EU)</th>
                  <th className="px-4 py-2 font-semibold">Довжина стопи, см</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_ROWS.map((row) => (
                  <tr key={row.eu} className="border-t border-border">
                    <td className="px-4 py-2">{row.eu}</td>
                    <td className="px-4 py-2">{row.footLengthCm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
