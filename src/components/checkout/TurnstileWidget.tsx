"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import Script from "next/script";

export type TurnstileHandle = {
  getToken(): Promise<string | null>;
  reset(): void;
};

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const TOKEN_TIMEOUT_MS = 10_000;

// Невидимий Cloudflare Turnstile. Без NEXT_PUBLIC_TURNSTILE_SITE_KEY нічого не рендерить і не вантажить скрипт.
export const TurnstileWidget = forwardRef<TurnstileHandle>(function TurnstileWidget(_props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const pendingRef = useRef<{ resolve: (token: string | null) => void; timer: ReturnType<typeof setTimeout> } | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  const settle = useCallback((token: string | null) => {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingRef.current = null;
    pending.resolve(token);
  }, []);

  useEffect(() => {
    if (!SITE_KEY) return;
    if (window.turnstile) setScriptReady(true);
  }, []);

  useEffect(() => {
    if (!SITE_KEY || !scriptReady || !containerRef.current || !window.turnstile) return;
    if (widgetIdRef.current !== null) return;
    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        action: "checkout",
        execution: "execute",
        appearance: "interaction-only",
        language: "uk",
        callback: (token) => settle(token),
        "error-callback": () => settle(null),
        "expired-callback": () => settle(null),
      });
    } catch {
      widgetIdRef.current = null;
    }
    return () => {
      if (widgetIdRef.current !== null) {
        try {
          window.turnstile?.remove(widgetIdRef.current);
        } catch {
          // ігноруємо
        }
        widgetIdRef.current = null;
      }
      settle(null);
    };
  }, [scriptReady, settle]);

  useImperativeHandle(
    ref,
    () => ({
      getToken() {
        if (!SITE_KEY) return Promise.resolve(null);
        const api = window.turnstile;
        const widgetId = widgetIdRef.current;
        if (!api || widgetId === null) return Promise.resolve(null);
        settle(null);
        return new Promise<string | null>((resolve) => {
          const timer = setTimeout(() => settle(null), TOKEN_TIMEOUT_MS);
          pendingRef.current = { resolve, timer };
          try {
            api.reset(widgetId);
            api.execute(widgetId);
          } catch {
            settle(null);
          }
        });
      },
      reset() {
        settle(null);
        if (widgetIdRef.current !== null) {
          try {
            window.turnstile?.reset(widgetIdRef.current);
          } catch {
            // ігноруємо
          }
        }
      },
    }),
    [settle]
  );

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div ref={containerRef} />
    </>
  );
});
