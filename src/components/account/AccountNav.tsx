"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/account", label: "Головна" },
  { href: "/account/discounts", label: "Знижки" },
  { href: "/account/orders", label: "Замовлення" },
  { href: "/account/profile", label: "Профіль" },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto md:flex-col md:gap-1 md:overflow-visible">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition md:rounded-lg",
              isActive ? "bg-accent text-white" : "text-ink-soft hover:bg-secondary/40"
            )}
          >
            {item.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="whitespace-nowrap rounded-full px-4 py-2 text-left text-sm font-semibold text-ink-soft transition hover:bg-secondary/40 md:rounded-lg"
      >
        Вийти
      </button>
    </nav>
  );
}
