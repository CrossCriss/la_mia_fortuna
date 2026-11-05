"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function AccountNavButton() {
  const { status } = useSession();

  return (
    <Link
      href={status === "authenticated" ? "/account" : "/account/login"}
      aria-label={status === "authenticated" ? "Особистий кабінет" : "Увійти"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/20 text-ink transition duration-150 ease-out hover:border-ink/40"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
      </svg>
    </Link>
  );
}
