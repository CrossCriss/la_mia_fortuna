"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatE164ForDisplay } from "@/lib/phone";
import { PhoneMaskField } from "@/components/ui/PhoneMaskField";
import { Button } from "@/components/ui/Button";

function inputClass(hasError?: boolean) {
  return cn(
    "w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-ink transition-colors duration-150 ease-out focus:border-accent focus:outline-none",
    hasError ? "border-sale" : "border-border"
  );
}

export function ProfileForm({
  initialName,
  initialEmail,
  initialPhone,
}: {
  initialName: string;
  initialEmail: string;
  initialPhone: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone ? formatE164ForDisplay(initialPhone) : "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSaving(true);
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Не вдалося зберегти профіль");
      }
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Сталася помилка");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">Ім&apos;я</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClass()}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass()}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">Телефон</span>
        <PhoneMaskField
          value={phone}
          onValueChange={setPhone}
          placeholder="+38 (0__) ___-__-__"
          className={inputClass()}
        />
      </label>

      {error && <p className="text-sm text-sale">{error}</p>}
      {success && <p className="text-sm text-accent">Збережено.</p>}

      <Button type="submit" disabled={isSaving} variant="secondary">
        {isSaving ? "Збереження…" : "Зберегти зміни"}
      </Button>
    </form>
  );
}
