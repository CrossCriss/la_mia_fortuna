import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import { SITE } from "@/lib/site-config";

// Email і графік роботи клієнтка ще не надала — позначено заглушкою,
// телефон/Instagram — реальні дані з макета (Main.dc.html, футер).
export default function ContactsPage() {
  const sellerFields = [
    { label: "Найменування", value: SITE.seller.legalName },
    { label: "Податковий номер", value: SITE.seller.taxId },
    { label: "Адреса", value: SITE.seller.address },
    { label: "Email", value: SITE.seller.email },
  ].filter((field) => field.value);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-[36px] font-semibold text-ink">Контакти</h1>
      <PlaceholderNotice />
      <dl className="space-y-3 text-sm text-ink-soft">
        <div>
          <dt className="font-medium text-ink">Viber, Telegram</dt>
          <dd>{SITE.phoneDisplay}</dd>
        </div>
        <div>
          <dt className="font-medium text-ink">Instagram</dt>
          <dd>{SITE.instagramHandle}</dd>
        </div>
        <div>
          <dt className="font-medium text-ink">Виробництво</dt>
          <dd>Харків</dd>
        </div>
      </dl>

      {sellerFields.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold text-ink">Продавець</h2>
          <dl className="space-y-3 text-sm text-ink-soft">
            {sellerFields.map((field) => (
              <div key={field.label}>
                <dt className="font-medium text-ink">{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
