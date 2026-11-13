import type { Metadata } from "next";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";

export const metadata: Metadata = {
  title: "Розмірна сітка",
  alternates: { canonical: "/size-guide" },
};

// Орієнтовна таблиця (стандартне співвідношення EU-розміру і довжини стопи
// в см) — клієнтка просила розділ "Розмірна сітка" (запит від 2026-11-06),
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
          <p>
            Поставте ногу на лист паперу, обведіть контур стопи і виміряйте найбільшу довжину в
            сантиметрах. Порівняйте результат із таблицею нижче — обирайте розмір, де довжина
            стопи найближча до вашої або трохи більша.
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
            Напишіть нам у Viber, Telegram чи Instagram довжину стопи в сантиметрах — підкажемо
            розмір для конкретної моделі.
          </p>
        </section>
      </div>
    </div>
  );
}
