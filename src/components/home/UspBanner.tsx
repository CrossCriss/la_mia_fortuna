const ITEMS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="h-6 w-6">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 8.25h19.5M2.25 8.25v9a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25v-9M2.25 8.25v-1.5A2.25 2.25 0 0 1 4.5 4.5h15a2.25 2.25 0 0 1 2.25 2.25v1.5M6 15.75h4.5"
        />
      </svg>
    ),
    // Тимчасовий текст — узгодити реальні умови оплати з клієнткою.
    title: "Оплата при отриманні",
    text: "Перевіряєте товар перед оплатою",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="h-6 w-6">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h8.25m-8.25 0H3.375m17.25 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21m-1.5 0V9.75a1.5 1.5 0 0 0-1.5-1.5h-3M3.375 18.75V9m0 9.75H1.5m1.875 0V9m0 0V6.375A1.125 1.125 0 0 1 4.5 5.25h9.75a1.125 1.125 0 0 1 1.125 1.125V9m-11.25 0h11.25m0 0h3.75l1.5 3v6.375c0 .621-.504 1.125-1.125 1.125h-.375"
        />
      </svg>
    ),
    // Тимчасовий текст — деталі доставки уточнюємо (Nova Poshta ще не підключена).
    title: "Доставка по всій Україні",
    text: "Нова пошта у будь-яке місто",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="h-6 w-6">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Z"
        />
      </svg>
    ),
    title: "Зручні розміри для кожної",
    text: "Таблиця розмірів у кожній картці товару",
  },
];

export function UspBanner() {
  return (
    <section className="mt-12 rounded-card border border-border bg-secondary/25 px-4 py-8 sm:px-8">
      <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-accent">
              {item.icon}
            </span>
            <div>
              <p className="font-display text-sm font-bold text-ink">{item.title}</p>
              <p className="mt-0.5 text-sm text-ink-soft">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
