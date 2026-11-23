// Клієнтська відправка подій у GA4 і Meta Pixel.
// Ніколи не кидає винятків назовні: аналітика не повинна ламати магазин.
// Скрипти вантажаться після гідратації (afterInteractive), тому якщо функції
// gtag/fbq ще не з'явилися, трохи чекаємо їх і відправляємо подію один раз.

import { toGa4, toMetaPixel, type AnalyticsEvent } from "./events";

/** Як часто перевіряємо, чи з'явилася функція скрипта (мс) */
const POLL_INTERVAL_MS = 200;
/** Скільки максимум чекаємо на скрипт (мс), потім тихо відмовляємось */
const POLL_TIMEOUT_MS = 5000;

/** Чи підключений хоча б один із скриптів аналітики */
export function isAnalyticsReady(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.gtag || window.fbq);
}

/**
 * Відправляє подію в одну систему. Якщо функція вже є, відправляє одразу
 * (синхронно), інакше опитує її появу до POLL_TIMEOUT_MS. Повертає true,
 * якщо подію відправлено без винятку. Кожна система відправляється максимум раз.
 */
function sendWhenReady(isAvailable: () => boolean, send: () => void): Promise<boolean> {
  const attempt = (): boolean => {
    try {
      send();
      return true;
    } catch {
      // Помилку цієї системи ігноруємо, щоб не заважати іншій і роботі сайту
      return false;
    }
  };

  if (isAvailable()) return Promise.resolve(attempt());

  return new Promise<boolean>((resolve) => {
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += POLL_INTERVAL_MS;
      if (isAvailable()) {
        clearInterval(timer);
        resolve(attempt());
      } else if (elapsed >= POLL_TIMEOUT_MS) {
        // Скрипт так і не з'явився (наприклад, ID не задані): тихо відмовляємось
        clearInterval(timer);
        resolve(false);
      }
    }, POLL_INTERVAL_MS);
  });
}

/**
 * Відправляє подію в GA4 і Meta Pixel. Результат true, якщо подію відправлено
 * хоча б в одну систему; false, якщо ні в одну (у тому числі на сервері).
 */
export async function track(event: AnalyticsEvent): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const ga4 = sendWhenReady(
    () => typeof window !== "undefined" && Boolean(window.gtag),
    () => {
      const { name, params } = toGa4(event);
      window.gtag?.("event", name, params);
    },
  );

  const pixel = sendWhenReady(
    () => typeof window !== "undefined" && Boolean(window.fbq),
    () => {
      const { name, params, eventId } = toMetaPixel(event);
      window.fbq?.("track", name, params, eventId ? { eventID: eventId } : undefined);
    },
  );

  const results = await Promise.all([ga4, pixel]);
  return results.some(Boolean);
}
