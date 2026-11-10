"use client";

import Link from "next/link";
import { useState } from "react";

type NavLink = { href: string; label: string };

export function AdminMobileNav({ links }: { links: NavLink[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Меню"
        aria-expanded={isOpen}
        className="flex h-9 w-9 flex-col items-center justify-center gap-1.5"
      >
        <span className="h-0.5 w-5 bg-neutral-900" />
        <span className="h-0.5 w-5 bg-neutral-900" />
        <span className="h-0.5 w-5 bg-neutral-900" />
      </button>

      {isOpen && (
        <div className="absolute inset-x-0 top-[57px] z-40 border-b border-neutral-200 bg-white px-4 py-2 shadow-sm">
          <nav className="flex flex-col text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="border-b border-neutral-100 py-3 font-medium text-neutral-700 last:border-b-0"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
