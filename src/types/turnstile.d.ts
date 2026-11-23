// Глобальне оголошення Cloudflare Turnstile (лише використовувані методи).

interface TurnstileRenderOptions {
  sitekey: string;
  action?: string;
  execution?: "render" | "execute";
  appearance?: "always" | "execute" | "interaction-only";
  language?: string;
  callback?: (token: string) => void;
  "error-callback"?: (errorCode?: string) => void;
  "expired-callback"?: () => void;
}

interface TurnstileApi {
  render: (container: string | HTMLElement, options: TurnstileRenderOptions) => string;
  execute: (container: string | HTMLElement) => void;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

interface Window {
  turnstile?: TurnstileApi;
}
