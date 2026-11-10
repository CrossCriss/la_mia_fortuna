"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  siteSettingsFormSchema,
  type SiteSettingsFormValues,
} from "@/lib/admin/site-settings-schema";
import { cn } from "@/lib/utils";

type CategoryOption = { id: string; label: string };

export function HomepageSettingsForm({
  initialValues,
  categories,
}: {
  initialValues: SiteSettingsFormValues;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<SiteSettingsFormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  function updateField<K extends keyof SiteSettingsFormValues>(
    key: K,
    value: SiteSettingsFormValues[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSavedMessage(null);
  }

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setUploadError(null);
    setIsUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "Не вдалося завантажити фото");
      updateField("heroImageUrl", data.url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Сталася помилка завантаження");
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) uploadFile(file);
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    setIsDraggingOver(true);
  }

  function handleDragLeave(event: React.DragEvent) {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDraggingOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setSavedMessage(null);

    const result = siteSettingsFormSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Не вдалося зберегти");
      }
      setSavedMessage("Збережено — зміни вже на сайті.");
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Сталася помилка");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Фото банера</h2>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex items-start gap-4 rounded-lg border-2 border-dashed p-3 transition",
            isDraggingOver ? "border-neutral-900 bg-neutral-100" : "border-transparent"
          )}
        >
          {form.heroImageUrl ? (
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border border-neutral-200">
              <img src={form.heroImageUrl} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => updateField("heroImageUrl", null)}
                className="absolute inset-x-0 bottom-0 bg-black/50 py-1 text-xs text-white hover:text-red-300"
              >
                ✕ Видалити
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex h-32 w-32 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-neutral-300 px-1 text-center text-xs text-neutral-500 hover:border-neutral-400 disabled:opacity-50"
            >
              {isUploading ? (
                "Завантаження…"
              ) : (
                <>
                  <span>+ Додати фото</span>
                  <span className="text-[10px] text-neutral-400">або перетягніть сюди</span>
                </>
              )}
            </button>
          )}
          <p className="pt-2 text-xs text-neutral-500">
            Вертикальне фото, бажано 1200×1600 пікселів і більше — на сайті воно обрізається по
            центру під висоту банера.
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-neutral-900">Сезонна колекція</h2>

        <Field label="Назва колекції" error={errors.seasonalLabel}>
          <input
            type="text"
            value={form.seasonalLabel}
            onChange={(e) => updateField("seasonalLabel", e.target.value)}
            placeholder="Напр. Зима 2027"
            className={inputClass(errors.seasonalLabel)}
          />
        </Field>

        <Field label="Куди веде посилання">
          <select
            value={form.seasonalCategoryId ?? ""}
            onChange={(e) => updateField("seasonalCategoryId", e.target.value || null)}
            className={inputClass()}
          >
            <option value="">— не показувати посилання —</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </Field>
        <p className="text-xs text-neutral-500">
          Ця назва й посилання зʼявляться одразу в трьох місцях: на картці банера головної, у
          меню зверху сайту і в підвалі. Категорії немає в списку? Створіть нову на сторінці{" "}
          «Категорії» — вона зʼявиться тут одразу.
        </p>
      </section>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}
      {savedMessage && <p className="text-sm text-green-700">{savedMessage}</p>}

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
