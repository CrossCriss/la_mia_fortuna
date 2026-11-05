"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/cart-store";

export function CartTriggerButton() {
  const toggle = useCartStore((state) => state.toggle);
  const count = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  const [isBumping, setIsBumping] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count === prevCount.current) return;
    prevCount.current = count;
    setIsBumping(true);
    const timeout = setTimeout(() => setIsBumping(false), 350);
    return () => clearTimeout(timeout);
  }, [count]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Відкрити кошик"
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-ink/20 text-ink transition duration-150 ease-out hover:border-ink/40"
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
        <path d="M6 8h12l-1.2 11.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      {count > 0 && (
        <span
          className={cn(
            "absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white",
            isBumping && "animate-cart-bump"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
