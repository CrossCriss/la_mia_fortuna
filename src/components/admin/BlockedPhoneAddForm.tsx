"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ERROR_TEXT = "Не вдалося зберегти. Спробуйте ще раз.";

export function BlockedPhoneAddForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/blocked-phones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, reason: reason.trim() || undefined }),
      });
      if (!response.ok) {
        let message = ERROR_TEXT;
        if (response.status === 400) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null;
          if (data?.error) message = data.error;
        }
        setError(message);
        return;
      }
      setPhone("");
      setReason("");
      router.refresh();
    } catch {
      setError(ERROR_TEXT);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded border border-neutral-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-neutral-700">
          Номер телефону
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-sm text-neutral-700">
          Причина (необов&apos;язково)
          <input
            type="text"
            value={reason}
            maxLength={200}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isBusy}
          className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
        >
          Заблокувати
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </form>
  );
}
