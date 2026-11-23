"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Відправляє PageView у Meta Pixel при переході між сторінками.
// Перший перегляд уже відправив сніпет, тому перший рендер пропускаємо.
// GA4 рахує переходи сам (enhanced measurement), вручну не дублюємо.
export function PageViewTracker() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    try {
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "PageView");
      }
    } catch {
      // Аналітика не повинна ламати сайт
    }
  }, [pathname]);

  return null;
}
