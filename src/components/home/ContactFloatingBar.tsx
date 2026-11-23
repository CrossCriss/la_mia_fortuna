"use client";

import { useEffect, useRef, useState } from "react";
import { SITE } from "@/lib/site-config";

// Плаваючі кнопки зв'язку на всіх публічних сторінках - запит клієнтки від
// 2026-11-07: телефон/Telegram/Instagram мають бути доступні в будь-який
// момент, не тільки внизу в футері. Номер і Instagram беруться з SITE.
// На телефоні (< md) три кнопки згорнуті в одну круглу: натискання розкриває
// їх над нею, Escape, клік поза меню або повторне натискання згортає.
// На md і ширше три кнопки завжди видимі. Розрізнення тільки через
// Tailwind-класи, без перевірки ширини в JS (немає hydration mismatch).
const CONTACTS = [
  {
    href: SITE.phoneHref,
    label: `Подзвонити: ${SITE.phoneDisplay}`,
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
    href: SITE.telegramUrl,
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
    href: SITE.instagramUrl,
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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    // Кнопки з підписами (а не лише іконки) - запит від 2026-11-07: люди
    // не помічали голі іконки. Підпис видно на всіх екранах.
    <div
      ref={rootRef}
      className="fixed bottom-5 right-4 z-30 flex flex-col items-end gap-2.5 md:right-6"
    >
      <div
        id="contact-menu"
        className={`flex flex-col items-end gap-2.5 transition-[opacity,transform,visibility] duration-200 ${
          open ? "" : "max-md:pointer-events-none max-md:invisible max-md:translate-y-2 max-md:opacity-0"
        }`}
      >
        {CONTACTS.map((contact) => {
          const isExternal = contact.href.startsWith("http");
          return (
            <a
              key={contact.label}
              href={contact.href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              aria-label={contact.label}
              onClick={() => setOpen(false)}
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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Закрити" : "Зв'язатися з нами"}
        aria-expanded={open}
        aria-controls="contact-menu"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-xl ring-2 ring-background transition hover:bg-accent-dark md:hidden"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="h-6 w-6">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
