"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="uk">
      <body className="bg-background text-ink">
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
          <h1 className="font-display text-[44px] font-semibold leading-[1.02] text-ink md:text-[56px]">
            Щось пішло не так
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-soft md:text-base">
            Ми вже знаємо про проблему. Спробуйте оновити сторінку або поверніться пізніше.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex h-12 items-center justify-center border border-ink bg-ink px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Спробувати ще раз
            </button>
            <a
              href="/"
              className="inline-flex h-12 items-center justify-center border border-ink bg-ink px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              На головну
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
