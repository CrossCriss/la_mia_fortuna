import { SITE } from "@/lib/site-config";

// Відмова чекауту з готовими контактами: покупниця завжди має шлях до замовлення через менеджера.
export function CheckoutBlockedNotice({ message }: { message: string }) {
  const linkClass =
    "rounded-xl border border-accent px-4 py-2.5 text-center text-sm font-medium text-accent-dark transition hover:bg-secondary/25";
  return (
    <div role="alert" className="space-y-3 rounded-2xl border border-neutral-200 bg-secondary/10 p-4">
      <p className="text-sm text-neutral-700">{message}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <a href={SITE.telegramUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
          Написати в Telegram
        </a>
        <a href={SITE.viberUrl} className={linkClass}>
          Написати у Viber
        </a>
        <a href={SITE.phoneHref} className={linkClass}>
          Зателефонувати
          <span className="block text-xs font-normal text-neutral-600">{SITE.phoneDisplay}</span>
        </a>
      </div>
    </div>
  );
}
