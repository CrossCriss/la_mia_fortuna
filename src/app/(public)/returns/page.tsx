import type { Metadata } from "next";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";

export const metadata: Metadata = {
  title: "Повернення/обмін",
  alternates: { canonical: "/returns" },
};

// ТИМЧАСОВИЙ ТЕКСТ для демонстрації клієнтці — узгодити реальні умови
// повернення/обміну з чинним законодавством про захист прав споживачів.
export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-[36px] font-semibold text-ink">Повернення/обмін</h1>
      <PlaceholderNotice />
      <div className="space-y-4 text-sm leading-relaxed text-ink-soft">
        <p>
          Ми хочемо, щоб ви залишились задоволені покупкою. Якщо розмір не підійшов або взуття не
          відповідає опису — зв&apos;яжіться з нами протягом 14 днів з дня отримання замовлення.
        </p>
        <p>
          Обмін і повернення можливі за умови збереження товарного вигляду, упаковки і відсутності
          слідів носіння.
        </p>
      </div>
    </div>
  );
}
