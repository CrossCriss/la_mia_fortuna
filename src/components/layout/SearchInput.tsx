"use client";

import { useEffect, useRef, useState } from "react";

function SearchIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

// Нативні GET-форми — Enter або клік по кнопці одразу переходять на
// /search?q=..., без dropdown-превью під час набору (за вимогою ТЗ).
// На мобільній (<640px) постійне поле обрізало плейсхолдер "Пошук", тож там
// це іконка-лупа, що розгортає повноширинну панель пошуку під шапкою;
// на sm і ширше лишається постійне поле без змін.
export function SearchInput() {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Пошук"
        aria-expanded={isOpen}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/20 text-ink-soft transition-colors duration-150 ease-out hover:text-ink sm:hidden"
      >
        <SearchIcon size={18} />
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className="absolute inset-x-0 top-16 z-40 border-b border-border bg-surface px-4 py-3 shadow-sm sm:hidden"
        >
          <form action="/search" method="GET" role="search" className="relative">
            <input
              ref={inputRef}
              type="search"
              name="q"
              placeholder="Пошук"
              aria-label="Пошук товарів"
              className="w-full rounded-full border border-ink/20 bg-transparent py-2 pl-4 pr-9 text-sm text-ink placeholder:text-ink-soft focus:border-ink/40 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Шукати"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-soft transition-colors duration-150 ease-out hover:text-ink"
            >
              <SearchIcon />
            </button>
          </form>
        </div>
      )}

      <form action="/search" method="GET" role="search" className="relative hidden sm:block">
        <input
          type="search"
          name="q"
          placeholder="Пошук"
          aria-label="Пошук товарів"
          className="w-36 rounded-full border border-ink/20 bg-transparent py-1.5 pl-3 pr-7 text-sm text-ink placeholder:text-ink-soft transition-all duration-150 ease-out focus:w-52 focus:border-ink/40 focus:outline-none md:w-44 md:focus:w-60"
        />
        <button
          type="submit"
          aria-label="Шукати"
          className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-soft transition-colors duration-150 ease-out hover:text-ink"
        >
          <SearchIcon />
        </button>
      </form>
    </>
  );
}
