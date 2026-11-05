"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { productFormSchema, type ProductFormValues } from "@/lib/admin/product-schema";
import { cn } from "@/lib/utils";

type CategoryOption = { id: string; label: string };
type SizeOption = { id: string; value: string };
type ColorOption = { id: string; name: string; hex: string };

const MAX_IMAGES = 6;

export function ProductForm({
  productId,
  initialValues,
  categories,
  sizes,
  colors,
}: {
  productId?: string;
  initialValues: ProductFormValues;
  categories: CategoryOption[];
  sizes: SizeOption[];
  colors: ColorOption[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProductFormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function updateField<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addVariant() {
    updateField("variants", [
      ...form.variants,
      { sizeId: sizes[0]?.id ?? "", colorId: colors[0]?.id ?? "", stock: 0 },
    ]);
  }

  function updateVariant(index: number, patch: Partial<ProductFormValues["variants"][number]>) {
    updateField(
      "variants",
      form.variants.map((variant, i) => (i === index ? { ...variant, ...patch } : variant))
    );
  }

  function removeVariant(index: number) {
    updateField(
      "variants",
      form.variants.filter((_, i) => i !== index)
    );
  }

  function removeImage(index: number) {
    updateField(
      "images",
      form.images.filter((_, i) => i !== index)
    );
  }

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= form.images.length) return;
    const next = [...form.images];
    [next[index], next[target]] = [next[target], next[index]];
    updateField("images", next);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setUploadError(null);
    const availableSlots = MAX_IMAGES - form.images.length;
    if (availableSlots <= 0) {
      setUploadError(`Максимум ${MAX_IMAGES} фото на товар`);
      return;
    }

    setIsUploading(true);
    try {
      for (const file of files.slice(0, availableSlots)) {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? "Не вдалося завантажити фото");
        updateField("images", [...form.images, { url: data.url, alt: form.name }]);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Сталася помилка завантаження");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const result = productFormSchema.safeParse(form);
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
      const url = productId ? `/api/admin/products/${productId}` : "/api/admin/products";
      const response = await fetch(url, {
        method: productId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Не вдалося зберегти товар");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Сталася помилка");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      <section className="grid gap-4 sm:grid-cols-2">
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
          />
        </Field>

        <Field label="Артикул (SKU)" error={errors.sku}>
          <input
            type="text"
            value={form.sku}
            onChange={(e) => updateField("sku", e.target.value)}
            className={inputClass(errors.sku)}
          />
        </Field>

        <Field label="Категорія" error={errors.categoryId}>
          <select
            value={form.categoryId}
            onChange={(e) => updateField("categoryId", e.target.value)}
            className={inputClass(errors.categoryId)}
          >
            <option value="">— оберіть категорію —</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Ціна, грн" error={errors.price}>
          <input
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => updateField("price", Number(e.target.value))}
            className={inputClass(errors.price)}
          />
        </Field>

        <Field label="Знижкова ціна, грн (необов'язково)" error={errors.discountPrice}>
          <input
            type="number"
            step="0.01"
            value={form.discountPrice ?? ""}
            onChange={(e) =>
              updateField("discountPrice", e.target.value === "" ? null : Number(e.target.value))
            }
            className={inputClass(errors.discountPrice)}
          />
        </Field>
      </section>

      <section className="grid gap-4">
        <Field label="Склад тканини (необов'язково)">
          <input
            type="text"
            value={form.fabricComposition ?? ""}
            onChange={(e) => updateField("fabricComposition", e.target.value)}
            className={inputClass()}
          />
        </Field>

        <Field label="Опис (необов'язково)">
          <textarea
            value={form.description ?? ""}
            onChange={(e) => updateField("description", e.target.value)}
            rows={3}
            className={inputClass()}
          />
        </Field>

        <Field label="SEO-опис (необов'язково)">
          <textarea
            value={form.seoDescription ?? ""}
            onChange={(e) => updateField("seoDescription", e.target.value)}
            rows={2}
            className={inputClass()}
          />
        </Field>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isNew}
              onChange={(e) => updateField("isNew", e.target.checked)}
            />
            Новинка
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPromo}
              onChange={(e) => updateField("isPromo", e.target.checked)}
            />
            Акція
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => updateField("isPublished", e.target.checked)}
            />
            Опубліковано
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => updateField("isFeatured", e.target.checked)}
            />
            Топ продажів (бейдж на головній)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.showOnHomepage}
              onChange={(e) => updateField("showOnHomepage", e.target.checked)}
            />
            На головній (ручний відбір у секції категорії)
          </label>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Фото (до {MAX_IMAGES})</h2>
        {errors.images && <p className="mb-2 text-xs text-red-600">{errors.images}</p>}
        <div className="flex flex-wrap gap-3">
          {form.images.map((image, index) => (
            <div key={image.id ?? image.url} className="relative h-24 w-24 overflow-hidden rounded-lg border border-neutral-200">
              <img src={image.url} alt={image.alt ?? ""} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-1 py-0.5">
                <button
                  type="button"
                  onClick={() => moveImage(index, -1)}
                  disabled={index === 0}
                  className="text-xs text-white disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="text-xs text-white hover:text-red-300"
                >
                  ✕
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, 1)}
                  disabled={index === form.images.length - 1}
                  className="text-xs text-white disabled:opacity-30"
                >
                  →
                </button>
              </div>
            </div>
          ))}
          {form.images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 text-xs text-neutral-500 hover:border-neutral-400 disabled:opacity-50"
            >
              {isUploading ? "Завантаження…" : "+ Додати фото"}
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">Розміри, кольори, залишки</h2>
          <button
            type="button"
            onClick={addVariant}
            className="text-sm text-neutral-700 hover:underline"
          >
            + Додати варіант
          </button>
        </div>
        {errors.variants && <p className="mb-2 text-xs text-red-600">{errors.variants}</p>}

        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-medium">Розмір</th>
                <th className="px-3 py-2 font-medium">Колір</th>
                <th className="px-3 py-2 font-medium">Залишок</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {form.variants.map((variant, index) => (
                <tr key={variant.id ?? index} className="border-b border-neutral-100 last:border-0">
                  <td className="px-3 py-2">
                    <select
                      value={variant.sizeId}
                      onChange={(e) => updateVariant(index, { sizeId: e.target.value })}
                      className={inputClass()}
                    >
                      {sizes.map((size) => (
                        <option key={size.id} value={size.id}>
                          {size.value}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={variant.colorId}
                      onChange={(e) => updateVariant(index, { colorId: e.target.value })}
                      className={inputClass()}
                    >
                      {colors.map((color) => (
                        <option key={color.id} value={color.id}>
                          {color.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      value={variant.stock}
                      onChange={(e) => updateVariant(index, { stock: Number(e.target.value) })}
                      className={inputClass()}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Видалити
                    </button>
                  </td>
                </tr>
              ))}
              {form.variants.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-neutral-400">
                    Варіантів ще немає.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {isSubmitting ? "Збереження…" : "Зберегти товар"}
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
