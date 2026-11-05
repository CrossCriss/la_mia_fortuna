"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type SubCategory = { slug: string; name: string };

const CLOSE_DELAY_MS = 180;

export function NavDropdown({
  href,
  label,
  subcategories,
}: {
  href: string;
  label: string;
  subcategories: SubCategory[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openNow() {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    setIsOpen(true);
  }

  function closeWithDelay() {
    closeTimeout.current = setTimeout(() => setIsOpen(false), CLOSE_DELAY_MS);
  }

  if (subcategories.length === 0) {
    return (
      <Link href={href} className="text-ink/70 transition hover:text-ink">
        {label}
      </Link>
    );
  }

  return (
    <div className="relative" onMouseEnter={openNow} onMouseLeave={closeWithDelay}>
      <Link href={href} className="text-ink/70 transition hover:text-ink">
        {label}
      </Link>

      <div
        className={`absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-3 transition-all duration-200 ease-out ${
          isOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <div className="rounded-card border border-border bg-surface p-2 shadow-lg">
          {subcategories.map((subcategory) => (
            <Link
              key={subcategory.slug}
              href={`/catalog/${subcategory.slug}`}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-ink/80 transition hover:bg-accent/10 hover:text-accent-dark"
            >
              {subcategory.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
