// Клієнтська відправка подій у GA4 і Meta Pixel.
// Ніколи не кидає винятків назовні: аналітика не повинна ламати магазин.

import { toGa4, toMetaPixel, type AnalyticsEvent } from "./events";

/** Чи підключений хоча б один із скриптів аналітики */
export function isAnalyticsReady(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.gtag || window.fbq);
}

export function track(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;

  try {
    if (window.gtag) {
      const { name, params } = toGa4(event);
      window.gtag("event", name, params);
    }
  } catch {
    // Помилку GA4 ігноруємо, щоб не заважати Meta Pixel і роботі сайту
  }

  try {
    if (window.fbq) {
      const { name, params, eventId } = toMetaPixel(event);
      window.fbq("track", name, params, eventId ? { eventID: eventId } : undefined);
    }
  } catch {
    // Помилку Meta Pixel ігноруємо
  }
}
