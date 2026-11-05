"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { categoryFormSchema, type CategoryFormValues } from "@/lib/admin/category-schema";
import { cn } from "@/lib/utils";

type ParentOption = { id: string; name: string };

const KIND_LABELS: Record<CategoryFormValues["kind"], string> = {
  REGULAR: "Звичайна",
  NEW_ARRIVALS: "Новинки",
  PROMO: "Акції",
};

export function CategoryForm({
  categoryId,
  initialValues,
  parentOptions,
  featuredOnHomeCount = 0,
}: {
  categoryId?: string;
  initialValues: CategoryFormValues;
  parentOptions: ParentOption[];
  featuredOnHomeCount?: number;
}) {
  const router = useRouter();
  const [form, setForm] = useState<CategoryFormValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryFormValues, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const result = categoryFormSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof CategoryFormValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      const url = categoryId ? `/api/admin/categories/${categoryId}` : "/api/admin/categories";
      const response = await fetch(url, {
        method: categoryId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Не вдалося зберегти категорію");
      }

      router.push("/admin/categories");
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Сталася помилка");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <Field label="Назва" error={errors.name}>
        <input
          type="text"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          className={inputClass(errors.name)}
        />
      </Field>

      <Field label="Slug" error={errors.slug}>
        <input
          type="text"
          value={form.slug}
          onChange={(e) => updateField("slug", e.target.value)}
          className={inputClass(errors.slug)}
          placeholder="napryklad-taka-nazva"
        />
      </Field>

      <Field label="Батьківська категорія">
        <select
          value={form.parentId ?? ""}
          onChange={(e) => updateField("parentId", e.target.value || null)}
          className={inputClass()}
        >
          <option value="">— немає (категорія верхнього рівня) —</option>
          {parentOptions
            .filter((option) => option.id !== categoryId)
            .map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
        </select>
      </Field>

      <Field label="Тип">
        <select
          value={form.kind}
          onChange={(e) => updateField("kind", e.target.value as CategoryFormValues["kind"])}
          className={inputClass()}
        >
          {Object.entries(KIND_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Порядок сортування">
        <input
          type="number"
          value={form.sortOrder}
          onChange={(e) => updateField("sortOrder", Number(e.target.value))}
          className={inputClass()}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isVisible}
          onChange={(e) => updateField("isVisible", e.target.checked)}
        />
        Показувати в каталозі
      </label>

      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isFeaturedOnHome}
            onChange={(e) => updateField("isFeaturedOnHome", e.target.checked)}
          />
          Показувати на головній
        </label>
        <p className="mt-1 pl-6 text-xs text-neutral-500">
          Рекомендовано обирати 3-4 категорії, щоб головна не була перевантажена. Зараз
          позначено: {featuredOnHomeCount}
          {form.isFeaturedOnHome && !initialValues.isFeaturedOnHome ? " (+ ця)" : ""}.
        </p>
      </div>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {isSubmitting ? "Збереження…" : "Зберегти"}
      </button>
    </form>
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
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-neutral-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function inputClass(error?: string) {
  return cn(
    "w-full rounded-lg border px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none",
    error ? "border-red-400" : "border-neutral-300"
  );
}
