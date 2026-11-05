"use client";

import Link from "next/link";
import { useState } from "react";

type SubCategory = { slug: string; name: string };
type NavLink = { href: string; label: string; subcategories?: SubCategory[] };

export function MobileNav({ links }: { links: NavLink[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedHref, setExpandedHref] = useState<string | null>(null);

  function close() {
    setIsOpen(false);
    setExpandedHref(null);
  }

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Меню"
        aria-expanded={isOpen}
        className="flex h-9 w-9 flex-col items-center justify-center gap-1.5"
      >
        <span className="h-0.5 w-5 bg-ink" />
        <span className="h-0.5 w-5 bg-ink" />
        <span className="h-0.5 w-5 bg-ink" />
      </button>

      {isOpen && (
        <div className="absolute inset-x-0 top-16 z-40 border-b border-border bg-surface px-4 py-2 shadow-sm">
          <nav className="flex flex-col text-sm font-semibold">
            {links.map((link) => {
              const subcategories = link.subcategories ?? [];
              const hasSubcategories = subcategories.length > 0;
              const isExpanded = expandedHref === link.href;

              return (
                <div key={link.href} className="border-b border-border/60 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <Link
                      href={link.href}
                      onClick={close}
                      className="flex-1 py-2.5 text-ink/70 transition hover:text-ink"
                    >
                      {link.label}
                    </Link>
                    {hasSubcategories && (
                      <button
                        type="button"
                        onClick={() => setExpandedHref(isExpanded ? null : link.href)}
                        aria-label={isExpanded ? "Згорнути підкатегорії" : "Розгорнути підкатегорії"}
                        aria-expanded={isExpanded}
                        className="flex h-9 w-9 shrink-0 items-center justify-center text-ink/50"
                      >
                        <svg
                          viewBox="0 0 20 20"
                          fill="none"
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        >
                          <path
                            d="M5 7.5L10 12.5L15 7.5"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {hasSubcategories && (
                    <div
                      className={`grid overflow-hidden transition-all duration-200 ease-out ${
                        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="min-h-0">
                        <div className="flex flex-col gap-0.5 pb-2 pl-3">
                          {subcategories.map((subcategory) => (
                            <Link
                              key={subcategory.slug}
                              href={`/catalog/${subcategory.slug}`}
                              onClick={close}
                              className="rounded-lg px-2 py-2 text-[13px] font-medium text-ink/60 transition hover:bg-accent/10 hover:text-accent-dark"
                            >
                              {subcategory.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
