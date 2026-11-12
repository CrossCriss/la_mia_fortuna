"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format-price";
import { checkoutFormSchema, type CheckoutFormValues } from "@/lib/checkout-schema";
import { formatVariantLabel } from "@/lib/color-print";
import { CityWarehouseFields } from "@/components/checkout/CityWarehouseFields";
import type { PaymentInit } from "@/lib/payment/types";

// LiqPay-режим повертає пару data+signature, яку треба відправити POST-ом
// на liqpay.ua (а не fetch — це має бути справжня навігація браузера).
function submitPaymentForm(url: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

// Дублює isOnlinePaymentEnabled з src/lib/payment/index.ts тим самим виразом:
// index.ts тягне crypto (серверний код), тому в клієнтський компонент не імпортуємо.
// NEXT_PUBLIC_ змінна вбудовується в бандл під час збірки.
const isOnlinePaymentEnabled = process.env.NEXT_PUBLIC_ONLINE_PAYMENT_ENABLED !== "false";

const initialForm: CheckoutFormValues = {
  customerName: "",
  phone: "",
  email: "",
  shippingCity: "",
  shippingCityRef: "",
  shippingWarehouse: "",
  shippingWarehouseRef: "",
  paymentMethod: isOnlinePaymentEnabled ? "ONLINE_CARD" : "CASH_ON_DELIVERY",
  comment: "",
};

type FieldErrors = Partial<Record<keyof CheckoutFormValues, string>>;

// Оформлення замовлення: 1 сторінка, без обов'язкової реєстрації (ТЗ §3).
// Місто/відділення — автокомпліт Nova Poshta (CityWarehouseFields), оплата
// карткою — реальний рахунок у активного провайдера (src/lib/payment).
export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);

  const [form, setForm] = useState<CheckoutFormValues>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  function updateField<K extends keyof CheckoutFormValues>(key: K, value: CheckoutFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const result = checkoutFormSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof CheckoutFormValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    if (items.length === 0) {
      setSubmitError("Кошик порожній.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...result.data,
          items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Не вдалося оформити замовлення. Спробуйте ще раз.");
      }

      const order: { orderNumber: string; paymentInit?: PaymentInit } = await response.json();
      clear();

      if (order.paymentInit?.kind === "redirect") {
        window.location.href = order.paymentInit.url;
        return;
      }
      if (order.paymentInit?.kind === "form") {
        submitPaymentForm(order.paymentInit.url, order.paymentInit.fields);
        return;
      }

      router.push(`/thank-you?order=${encodeURIComponent(order.orderNumber)}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Сталася помилка");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Оформлення замовлення</h1>
        <p className="mt-4 text-neutral-600">Кошик порожній.</p>
        <Link href="/catalog" className="mt-4 inline-block text-sm text-accent underline">
          Перейти до каталогу
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Оформлення замовлення</h1>

      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_360px]">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Field label="Ім'я та прізвище" error={errors.customerName}>
            <input
              type="text"
              value={form.customerName}
              onChange={(event) => updateField("customerName", event.target.value)}
              className={inputClass(errors.customerName)}
              placeholder="Марія Іваненко"
            />
          </Field>

          <Field label="Телефон" error={errors.phone}>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              className={inputClass(errors.phone)}
              placeholder="+380501234567"
            />
          </Field>

          <Field label="Email (необов'язково)" error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className={inputClass(errors.email)}
              placeholder="mail@example.com"
            />
          </Field>

          <CityWarehouseFields
            city={{ ref: form.shippingCityRef, label: form.shippingCity }}
            warehouse={{ ref: form.shippingWarehouseRef, label: form.shippingWarehouse }}
            cityError={errors.shippingCityRef ?? errors.shippingCity}
            warehouseError={errors.shippingWarehouseRef ?? errors.shippingWarehouse}
            onCityChange={({ ref, label }) => {
              updateField("shippingCityRef", ref);
              updateField("shippingCity", label);
            }}
            onWarehouseChange={({ ref, label }) => {
              updateField("shippingWarehouseRef", ref);
              updateField("shippingWarehouse", label);
            }}
          />

          <div>
            <p className="mb-2 text-sm font-medium text-neutral-700">Спосіб оплати</p>
            <div className={isOnlinePaymentEnabled ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 gap-3"}>
              {isOnlinePaymentEnabled && (
                <PaymentOption
                  label="Оплата карткою онлайн"
                  selected={form.paymentMethod === "ONLINE_CARD"}
                  onSelect={() => updateField("paymentMethod", "ONLINE_CARD")}
                />
              )}
              <PaymentOption
                label="Накладений платіж"
                selected={form.paymentMethod === "CASH_ON_DELIVERY"}
                onSelect={() => updateField("paymentMethod", "CASH_ON_DELIVERY")}
              />
            </div>
            {form.paymentMethod === "CASH_ON_DELIVERY" && (
              <p className="mt-2 text-xs text-neutral-500">
                За накладений платіж Нова Пошта стягує додаткову комісію за переказ коштів —
                вона оплачується окремо при отриманні.{isOnlinePaymentEnabled && " Оплата карткою онлайн без цієї комісії."}
              </p>
            )}
          </div>

          <Field label="Коментар до замовлення (необов'язково)">
            <textarea
              value={form.comment}
              onChange={(event) => updateField("comment", event.target.value)}
              rows={3}
              className={inputClass()}
            />
          </Field>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-accent py-3 text-sm font-medium text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Оформлюємо…" : "Підтвердити замовлення"}
          </button>
          <p className="text-xs text-neutral-500">
            Оформлюючи замовлення, ви погоджуєтесь з{" "}
            <Link href="/oferta" target="_blank" rel="noopener noreferrer" className="underline">
              публічною офертою
            </Link>{" "}
            та{" "}
            <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">
              політикою конфіденційності
            </Link>
          </p>
        </form>

        <aside className="h-fit rounded-2xl border border-neutral-100 p-5">
          <h2 className="font-semibold">Ваше замовлення</h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => {
              const variantLabel = formatVariantLabel(item.size, item.color);
              return (
                <li key={item.variantId} className="flex justify-between gap-3 text-sm">
                  <span className="text-neutral-600">
                    {item.name}{" "}
                    <span className="text-neutral-400">
                      {variantLabel && `(${variantLabel}) `}× {item.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium">{formatPrice(item.price * item.quantity)}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-sm">
            <div className="flex items-center justify-between text-base font-semibold text-neutral-900">
              <span>Разом</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function inputClass(error?: string) {
  return cn(
    "w-full rounded-lg border px-3 py-2 text-sm transition-colors duration-150 ease-out focus:border-accent focus:outline-none",
    error ? "border-red-400" : "border-neutral-200"
  );
}

function PaymentOption({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-xl border px-4 py-3 text-left text-sm font-medium transition",
        selected
          ? "border-accent bg-secondary/25 text-accent-dark"
          : "border-neutral-200 text-neutral-600 hover:border-accent/40"
      )}
    >
      {label}
    </button>
  );
}
