"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

function inputClass() {
  return "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink transition-colors duration-150 ease-out focus:border-accent focus:outline-none";
}

export type SavedAddress = {
  id: string;
  recipientName: string;
  phone: string;
  city: string;
  warehouse: string;
  isDefault: boolean;
};

export function SavedAddressList({ initialAddresses }: { initialAddresses: SavedAddress[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);

  if (addresses.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        Ще немає збережених адрес — вони з&apos;являться автоматично після першого замовлення.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {addresses.map((address) => (
        <AddressRow
          key={address.id}
          address={address}
          onUpdated={(updated) =>
            setAddresses((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
          }
          onDeleted={(id) => setAddresses((prev) => prev.filter((item) => item.id !== id))}
        />
      ))}
    </ul>
  );
}

function AddressRow({
  address,
  onUpdated,
  onDeleted,
}: {
  address: SavedAddress;
  onUpdated: (address: SavedAddress) => void;
  onDeleted: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(address);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/account/addresses/${address.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: form.recipientName,
          phone: form.phone,
          city: form.city,
          warehouse: form.warehouse,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Не вдалося зберегти адресу");
      }
      const updated = await response.json();
      onUpdated(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Сталася помилка");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/account/addresses/${address.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Не вдалося видалити адресу");
      }
      onDeleted(address.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Сталася помилка");
      setIsSaving(false);
    }
  }

  if (isEditing) {
    return (
      <li className={cn("rounded-card border border-border bg-surface p-4")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={form.recipientName}
            onChange={(event) => setForm({ ...form, recipientName: event.target.value })}
            placeholder="Ім'я одержувача"
            className={inputClass()}
          />
          <input
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            placeholder="Телефон"
            className={inputClass()}
          />
          <input
            value={form.city}
            onChange={(event) => setForm({ ...form, city: event.target.value })}
            placeholder="Місто"
            className={inputClass()}
          />
          <input
            value={form.warehouse}
            onChange={(event) => setForm({ ...form, warehouse: event.target.value })}
            placeholder="Відділення Нової Пошти"
            className={inputClass()}
          />
        </div>
        {error && <p className="mt-2 text-sm text-sale">{error}</p>}
        <div className="mt-3 flex gap-2 text-sm font-semibold">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-full bg-accent px-4 py-2 text-white disabled:opacity-50"
          >
            Зберегти
          </button>
          <button
            type="button"
            onClick={() => {
              setForm(address);
              setIsEditing(false);
            }}
            className="rounded-full px-4 py-2 text-ink-soft hover:bg-secondary/40"
          >
            Скасувати
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-3 rounded-card border border-border bg-surface p-4">
      <div className="text-sm">
        <p className="font-semibold text-ink">
          {address.recipientName}{" "}
          {address.isDefault && (
            <span className="ml-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
              За замовчуванням
            </span>
          )}
        </p>
        <p className="text-ink-soft">{address.phone}</p>
        <p className="text-ink-soft">
          {address.city}, {address.warehouse}
        </p>
        {error && <p className="mt-1 text-sale">{error}</p>}
      </div>
      <div className="flex shrink-0 gap-3 text-sm font-semibold">
        <button type="button" onClick={() => setIsEditing(true)} className="text-accent hover:underline">
          Редагувати
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isSaving}
          className="text-sale hover:underline disabled:opacity-50"
        >
          Видалити
        </button>
      </div>
    </li>
  );
}
