import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";

// Email і графік роботи клієнтка ще не надала — позначено заглушкою,
// телефон/Instagram — реальні дані з макета (Main.dc.html, футер).
export default function ContactsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-[36px] font-semibold text-ink">Контакти</h1>
      <PlaceholderNotice />
      <dl className="space-y-3 text-sm text-ink-soft">
        <div>
          <dt className="font-medium text-ink">Viber, Telegram</dt>
          <dd>066 790 10 44</dd>
        </div>
        <div>
          <dt className="font-medium text-ink">Instagram</dt>
          <dd>@la_mia_fortuna_shoes</dd>
        </div>
        <div>
          <dt className="font-medium text-ink">Виробництво</dt>
          <dd>Харків</dd>
        </div>
      </dl>
    </div>
  );
}
