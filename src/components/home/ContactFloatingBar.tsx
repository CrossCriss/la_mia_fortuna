// Плаваючі кнопки зв'язку на головній — запит клієнтки від 2026-11-07:
// телефон/Telegram/Instagram мають бути доступні в будь-який момент, не
// тільки внизу в футері. Номер і Instagram — ті самі, що в Footer.tsx.
const CONTACTS = [
  {
    href: "tel:+380667901044",
    label: "Подзвонити: 066 790 10 44",
    text: "Подзвонити",
    primary: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="h-5 w-5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 6.75c0 8.284 6.716 15 15 15h1.5a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
        />
      </svg>
    ),
  },
  {
    href: "https://t.me/+380667901044",
    label: "Написати в Telegram",
    text: "Telegram",
    primary: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12Zm0 0h7.5" />
      </svg>
    ),
  },
  {
    href: "https://www.instagram.com/la_mia_fortuna_shoes",
    label: "Instagram",
    text: "Instagram",
    primary: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="h-5 w-5">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export function ContactFloatingBar() {
  return (
    // Кнопки з підписами (а не лише іконки) — запит від 2026-11-07: люди
    // не помічали голі іконки. Підпис видно на всіх екранах.
    <div className="fixed bottom-5 right-4 z-30 flex flex-col items-end gap-2.5 md:right-6">
      {CONTACTS.map((contact) => {
        const isExternal = contact.href.startsWith("http");
        return (
          <a
            key={contact.label}
            href={contact.href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            aria-label={contact.label}
            className={`flex h-12 items-center gap-2.5 rounded-full pl-4 pr-5 text-sm font-semibold text-white shadow-xl ring-2 ring-background transition hover:scale-105 ${
              contact.primary ? "bg-accent hover:bg-accent-dark" : "bg-ink hover:bg-accent"
            }`}
          >
            {contact.icon}
            <span>{contact.text}</span>
          </a>
        );
      })}
    </div>
  );
}
