"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { productFormSchema, type ProductFormValues } from "@/lib/admin/product-schema";
import { cn } from "@/lib/utils";

type CategoryOption = { id: string; label: string };
type SizeOption = { id: string; value: string };
type ColorOption = { id: string; name: string; hex: string };

type ColorBlock = {
  colorId: string;
  // sizeId -> кількість пар; розмір без запису в об'єкті трактується як 0
  stockBySizeId: Record<string, number>;
};

const MAX_IMAGES = 6;

// Групуємо "пласкі" варіанти (розмір+колір+залишок) з БД у блоки по кольору
// — так їх і редагує адмінка (одна матриця розмірів на колір).
function buildInitialColorBlocks(variants: ProductFormValues["variants"]): ColorBlock[] {
  const byColor = new Map<string, Record<string, number>>();
  for (const variant of variants) {
    if (!byColor.has(variant.colorId)) byColor.set(variant.colorId, {});
    byColor.get(variant.colorId)![variant.sizeId] = variant.stock;
  }
  return Array.from(byColor.entries()).map(([colorId, stockBySizeId]) => ({ colorId, stockBySizeId }));
}

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
  const [colorBlocks, setColorBlocks] = useState<ColorBlock[]>(() =>
    buildInitialColorBlocks(initialValues.variants)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  function updateField<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addColorBlock() {
    const usedIds = new Set(colorBlocks.map((block) => block.colorId));
    const nextColor = colors.find((color) => !usedIds.has(color.id));
    if (!nextColor) return;
    setColorBlocks((prev) => [...prev, { colorId: nextColor.id, stockBySizeId: {} }]);
  }

  function updateColorBlock(index: number, patch: Partial<ColorBlock>) {
    setColorBlocks((prev) => prev.map((block, i) => (i === index ? { ...block, ...patch } : block)));
  }

  function removeColorBlock(index: number) {
    setColorBlocks((prev) => prev.filter((_, i) => i !== index));
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

  async function uploadFiles(files: File[]) {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    setUploadError(null);
    const availableSlots = MAX_IMAGES - form.images.length;
    if (availableSlots <= 0) {
      setUploadError(`Максимум ${MAX_IMAGES} фото на товар`);
      return;
    }

    setIsUploading(true);
    try {
      for (const file of imageFiles.slice(0, availableSlots)) {
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

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    uploadFiles(files);
  }

  // Перетягування фото прямо з Telegram/Finder тощо — без обов'язкового
  // відкриття системного діалогу вибору файлу.
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
    uploadFiles(Array.from(event.dataTransfer.files ?? []));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    // id наявних варіантів (щоб PUT оновлював, а не видаляв і створював
    // заново кожну клітинку матриці, яку адмінка не чіпала).
    const existingIdByKey = new Map(
      initialValues.variants.map((variant) => [`${variant.sizeId}:${variant.colorId}`, variant.id])
    );
    const variants = colorBlocks.flatMap((block) =>
      sizes.map((size) => ({
        id: existingIdByKey.get(`${size.id}:${block.colorId}`),
        sizeId: size.id,
        colorId: block.colorId,
        stock: block.stockBySizeId[size.id] ?? 0,
      }))
    );

    const payload: ProductFormValues = { ...form, variants };
    const result = productFormSchema.safeParse(payload);
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
            // Порожнє поле показуємо як порожнє (а не "0"), інакше контрольований
            // інпут миттєво повертає нуль після видалення останньої цифри і
            // стирання значення стає неможливим.
            value={form.price === 0 ? "" : form.price}
            onChange={(e) => updateField("price", e.target.value === "" ? 0 : Number(e.target.value))}
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
        <Field label="Матеріал (необов'язково)">
          <input
            type="text"
            placeholder="Напр. натуральна шкіра, хутрова підкладка"
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

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => updateField("isPublished", e.target.checked)}
            />
            Показувати на сайті
          </label>
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
              checked={form.isFeatured}
              onChange={(e) => updateField("isFeatured", e.target.checked)}
            />
            Значок «Топ продажів»
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.showOnHomepage}
              onChange={(e) => updateField("showOnHomepage", e.target.checked)}
            />
            Закріпити на головній сторінці
          </label>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Фото (до {MAX_IMAGES})</h2>
        {errors.images && <p className="mb-2 text-xs text-red-600">{errors.images}</p>}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex flex-wrap gap-3 rounded-lg border-2 border-dashed p-3 transition",
            isDraggingOver
              ? "border-neutral-900 bg-neutral-100"
              : "border-transparent"
          )}
        >
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
              className="flex h-24 w-24 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-neutral-300 px-1 text-center text-xs text-neutral-500 hover:border-neutral-400 disabled:opacity-50"
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
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">Кольори й залишки за розмірами</h2>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/colors"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-neutral-500 hover:underline"
              title="Відкриється в новій вкладці, щоб не втратити заповнену форму товару"
            >
              Немає потрібного кольору? ↗
            </Link>
            <button
              type="button"
              onClick={addColorBlock}
              disabled={colorBlocks.length >= colors.length}
              className="text-sm text-neutral-700 hover:underline disabled:opacity-40"
            >
              + Додати колір
            </button>
          </div>
        </div>
        <p className="mb-3 text-xs text-neutral-500">
          Для кожного кольору познач, які розміри зараз є в наявності. Точного обліку кількості
          пар немає — лише «є» чи «немає»; розмір без галочки на сайті буде показано закресленим.
        </p>
        {errors.variants && <p className="mb-2 text-xs text-red-600">{errors.variants}</p>}

        <div className="space-y-3">
          {colorBlocks.map((block, index) => {
            const usedByOthers = new Set(
              colorBlocks.filter((_, i) => i !== index).map((other) => other.colorId)
            );
            const availableColors = colors.filter(
              (color) => color.id === block.colorId || !usedByOthers.has(color.id)
            );
            const selectedColor = colors.find((color) => color.id === block.colorId);

            return (
              <div key={index} className="rounded-lg border border-neutral-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {selectedColor && (
                      <span
                        className="h-5 w-5 shrink-0 rounded-full border border-neutral-300"
                        style={{ backgroundColor: selectedColor.hex }}
                      />
                    )}
                    <select
                      value={block.colorId}
                      onChange={(e) => updateColorBlock(index, { colorId: e.target.value })}
                      className={inputClass()}
                    >
                      {availableColors.map((color) => (
                        <option key={color.id} value={color.id}>
                          {color.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeColorBlock(index)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Видалити колір
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {sizes.map((size) => {
                    const isAvailable = (block.stockBySizeId[size.id] ?? 0) > 0;
                    return (
                      <button
                        key={size.id}
                        type="button"
                        aria-pressed={isAvailable}
                        onClick={() =>
                          updateColorBlock(index, {
                            stockBySizeId: {
                              ...block.stockBySizeId,
                              [size.id]: isAvailable ? 0 : 1,
                            },
                          })
                        }
                        className={cn(
                          "flex h-10 w-14 items-center justify-center rounded-lg border text-sm font-semibold transition",
                          isAvailable
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-neutral-300 text-neutral-400 hover:border-neutral-400"
                        )}
                      >
                        {size.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {colorBlocks.length === 0 && (
            <p className="rounded-lg border border-dashed border-neutral-300 px-3 py-6 text-center text-sm text-neutral-400">
              Кольорів ще немає — натисніть «+ Додати колір».
            </p>
          )}
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
