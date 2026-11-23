"use client";

import { useEffect, useRef } from "react";
import {
  mergeAttribution,
  parseAttribution,
  readAttribution,
  writeAttribution,
} from "@/lib/analytics/attribution";

// Один раз при завантаженні запам'ятовує UTM-мітки та джерело переходу.
export function AttributionCapture() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    try {
      const now = new Date();
      const existing = readAttribution();
      const incoming = parseAttribution(
        window.location.search,
        document.referrer,
        window.location.pathname,
        now,
      );
      const merged = mergeAttribution(existing, incoming, now);

      if (merged === existing) return;
      writeAttribution(merged);
    } catch {
      // Аналітика не повинна ламати сайт
    }
  }, []);

  return null;
}
