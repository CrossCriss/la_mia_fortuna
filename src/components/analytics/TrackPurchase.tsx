"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics/track";
import type { AnalyticsItem } from "@/lib/analytics/events";

type Props = {
  orderNumber: string;
  value: number;
  items: AnalyticsItem[];
};

const KEY_PREFIX = "lmf-purchase:";

/**
 * Відправляє подію Purchase один раз на замовлення.
 * Ключ у localStorage пишемо лише після успішної відправки;
 * якщо localStorage недоступний, подію все одно відправляємо (дубль краще за втрату).
 */
export function TrackPurchase({ orderNumber, value, items }: Props) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    const key = `${KEY_PREFIX}${orderNumber}`;

    try {
      if (window.localStorage.getItem(key) !== null) return;
    } catch {
      // localStorage недоступний: відправляємо подію без перевірки
    }

    Promise.resolve(track({ name: "purchase", orderNumber, items, value }))
      .then((sent: unknown) => {
        if (sent !== true) return;
        try {
          window.localStorage.setItem(key, "1");
        } catch {
          // localStorage недоступний: ключ не пишемо
        }
      })
      .catch(() => {
        // Аналітика не повинна ламати сторінку
      });
  }, [orderNumber, value, items]);

  return null;
}
