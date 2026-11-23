// Глобальні оголошення для скриптів аналітики (GA4 і Meta Pixel).
// Поля необов'язкові: скрипти можуть бути не підключені (немає ідентифікаторів у .env).

type GtagFunction = (
  command: string,
  ...args: Array<string | Record<string, unknown> | Date | undefined>
) => void;

type FbqFunction = (
  command: string,
  eventName?: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string },
) => void;

interface Window {
  gtag?: GtagFunction;
  fbq?: FbqFunction;
  dataLayer?: unknown[];
}
