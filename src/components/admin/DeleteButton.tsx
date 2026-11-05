"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteButton({
  url,
  confirmMessage,
  label = "Видалити",
  onDeleted,
}: {
  url: string;
  confirmMessage: string;
  label?: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(confirmMessage)) return;
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(url, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Не вдалося видалити");
      }
      onDeleted?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Сталася помилка");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="text-sm text-red-600 hover:underline disabled:opacity-50"
      >
        {isDeleting ? "…" : label}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
