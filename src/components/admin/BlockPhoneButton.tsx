"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ERROR_TEXT = "Не вдалося зберегти. Спробуйте ще раз.";

export function BlockPhoneButton({
  phone,
  blocked,
  reason,
}: {
  phone: string;
  blocked: boolean;
  reason?: string | null;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function block() {
    setIsBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/blocked-phones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, reason: text.trim() || undefined }),
      });
      if (!response.ok) throw new Error("fail");
      setIsOpen(false);
      setText("");
      router.refresh();
    } catch {
      setError(ERROR_TEXT);
    } finally {
      setIsBusy(false);
    }
  }

  async function unblock() {
    if (!window.confirm("Розблокувати цей номер?")) return;
    setIsBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/blocked-phones/${encodeURIComponent(phone)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("fail");
      router.refresh();
    } catch {
      setError(ERROR_TEXT);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {blocked ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
            Номер заблоковано
          </span>
          {reason && <span className="text-xs text-neutral-500">{reason}</span>}
          <button
            type="button"
            onClick={unblock}
            disabled={isBusy}
            className="rounded border border-neutral-300 px-2 py-0.5 text-xs hover:bg-neutral-50 disabled:opacity-50"
          >
            Розблокувати
          </button>
        </div>
      ) : isOpen ? (
        <div className="space-y-2">
          <label className="block text-xs text-neutral-600">
            Причина (необов&apos;язково)
            <input
              type="text"
              value={text}
              maxLength={200}
              onChange={(e) => setText(e.target.value)}
              className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={block}
              disabled={isBusy}
              className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
            >
              Заблокувати
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setError(null);
              }}
              disabled={isBusy}
              className="rounded border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-50"
            >
              Скасувати
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded border border-neutral-300 px-2 py-0.5 text-xs hover:bg-neutral-50"
        >
          Заблокувати номер
        </button>
      )}
      <p className="text-xs text-neutral-400">
        З заблокованого номера не можна оформити замовлення з накладеним платежем.
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
