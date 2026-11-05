import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";

// Розгорнута історія бренду від клієнтки ще не надана — залишаємо
// короткий текст з макета (Main.dc.html) і позначку-заглушку.
export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-[36px] font-semibold text-ink">Про нас</h1>
      <PlaceholderNotice />
      <div className="space-y-4 text-sm leading-relaxed text-ink-soft">
        <p>
          La Mia Fortuna Shoes — жіноче взуття з любов&apos;ю. Власне виробництво в Харкові,
          натуральна шкіра і 15 років досвіду в продажах.
        </p>
        <p>
          Взуття шиють на власній фабриці, тому ціна чесна, а якість під контролем на кожному
          етапі — від вибору шкіри до фінального огляду пари перед відправкою.
        </p>
      </div>
    </div>
  );
}
