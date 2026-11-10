"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { colorFormSchema } from "@/lib/admin/color-schema";

const DEFAULT_HEX = "#cccccc";

export function AddColorForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [hex, setHex] = useState(DEFAULT_HEX);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const result = colorFormSchema.safeParse({ name, hex });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Перевірте дані");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Не вдалося додати колір");
      }
      setName("");
      setHex(DEFAULT_HEX);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Сталася помилка");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-neutral-700">Назва кольору</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Напр. Бежевий"
          className="w-56 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-neutral-700">Колір</span>
        <input
          type="color"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          className="h-10 w-16 cursor-pointer rounded-lg border border-neutral-300 p-1"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {isSubmitting ? "Додаємо…" : "+ Додати колір"}
      </button>

      {error && <span className="basis-full text-xs text-red-600">{error}</span>}
    </form>
  );
}
