"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

function inputClass(hasError?: boolean) {
  return cn(
    "w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-ink transition-colors duration-150 ease-out focus:border-accent focus:outline-none",
    hasError ? "border-sale" : "border-border"
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setError("Пароль має містити щонайменше 6 символів");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Паролі не збігаються");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Не вдалося змінити пароль");
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Сталася помилка");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {hasPassword && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Поточний пароль</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className={inputClass()}
            autoComplete="current-password"
          />
        </label>
      )}

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">Новий пароль</span>
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className={inputClass()}
          autoComplete="new-password"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">Підтвердіть новий пароль</span>
        <input
          type="password"
          value={confirmNewPassword}
          onChange={(event) => setConfirmNewPassword(event.target.value)}
          className={inputClass()}
          autoComplete="new-password"
        />
      </label>

      {error && <p className="text-sm text-sale">{error}</p>}
      {success && <p className="text-sm text-accent">Пароль змінено.</p>}

      <Button type="submit" disabled={isSaving} variant="secondary">
        {isSaving ? "Збереження…" : "Змінити пароль"}
      </Button>
    </form>
  );
}
