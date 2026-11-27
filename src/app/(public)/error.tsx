"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/errors/ErrorScreen";

export default function PublicError({
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
    <ErrorScreen
      title="Щось пішло не так"
      text="Ми вже знаємо про проблему. Спробуйте оновити сторінку або поверніться пізніше."
      action={
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex h-12 items-center justify-center border border-ink bg-ink px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Спробувати ще раз
        </button>
      }
    />
  );
}
