"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "NEW", label: "Новий" },
  { value: "CONFIRMED", label: "Підтверджено (оплачено/накладений платіж)" },
  { value: "SHIPPED", label: "Відправлено" },
  { value: "DELIVERED", label: "Доставлено" },
  { value: "CANCELED", label: "Скасовано" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "PENDING", label: "Очікує" },
  { value: "PAID", label: "Оплачено" },
  { value: "FAILED", label: "Помилка" },
  { value: "REFUNDED", label: "Повернено" },
];

export function OrderStatusControl({
  orderId,
  currentStatus,
  currentPaymentStatus,
  currentTrackingNumber,
}: {
  orderId: string;
  currentStatus: string;
  currentPaymentStatus: string;
  currentTrackingNumber: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [paymentStatus, setPaymentStatus] = useState(currentPaymentStatus);
  const [trackingNumber, setTrackingNumber] = useState(currentTrackingNumber ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, paymentStatus, trackingNumber }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Не вдалося оновити замовлення");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Сталася помилка");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="h-fit rounded-lg border border-neutral-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-neutral-900">Статус замовлення</h2>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-neutral-700">Статус</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm">
        <span className="mb-1 block font-medium text-neutral-700">Статус оплати</span>
        <select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        >
          {PAYMENT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-neutral-400">
          Для онлайн-оплати оновлюється автоматично вебхуком провайдера; саме це поле рахується для накопичувальної знижки клієнта.
        </span>
      </label>

      <label className="mt-4 block text-sm">
        <span className="mb-1 block font-medium text-neutral-700">Номер ТТН</span>
        <input
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="вписується вручну після створення ТТН у кабінеті Nova Poshta"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="mt-4 w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {isSaving ? "Збереження…" : "Зберегти"}
      </button>
    </div>
  );
}
