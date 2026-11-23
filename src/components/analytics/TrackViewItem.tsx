"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/track";
import type { AnalyticsItem } from "@/lib/analytics/events";

// Відправляє view_item (GA4) / ViewContent (Meta Pixel) один раз на товар.
export function TrackViewItem({ item }: { item: AnalyticsItem }) {
  useEffect(() => {
    track({ name: "view_item", item });
    // Залежність тільки від slug: зміна інших полів не має дублювати подію
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  return null;
}
