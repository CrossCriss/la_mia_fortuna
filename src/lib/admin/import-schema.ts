import { z } from "zod";

// Поля товару, на які можна зіставити колонку файлу імпорту.
export const IMPORT_TARGET_FIELDS = [
  "ignore",
  "name",
  "sku",
  "price",
  "stock",
  "crmCategory",
  "subcategory",
  "size",
  "color",
] as const;

export type ImportTargetField = (typeof IMPORT_TARGET_FIELDS)[number];

export const IMPORT_TARGET_FIELD_LABELS: Record<ImportTargetField, string> = {
  ignore: "— не імпортувати —",
  name: "Назва товару",
  sku: "SKU (артикул)",
  price: "Ціна",
  stock: "Залишок",
  crmCategory: "Категорія з CRM",
  subcategory: "Підкатегорія",
  size: "Розмір",
  color: "Колір",
};

export const importRowInputSchema = z.object({
  rowNumber: z.number(),
  name: z.string().optional(),
  sku: z.string().optional(),
  price: z.string().optional(),
  stock: z.string().optional(),
  crmCategory: z.string().optional(),
  subcategory: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
});

export type ImportRowInput = z.infer<typeof importRowInputSchema>;

export const importRequestSchema = z.object({
  dryRun: z.boolean(),
  // Значення колонки "категорія з CRM" (як зустрічається у файлі) -> id батьківської категорії на сайті.
  categoryMapping: z.record(z.string()),
  rows: z.array(importRowInputSchema).min(1, "Файл порожній"),
});

export type ImportRequest = z.infer<typeof importRequestSchema>;

export type ImportSkippedRow = {
  rowNumber: number;
  name?: string;
  reason: string;
};

export type ImportSummary = {
  totalRows: number;
  totalProducts: number;
  toCreate: number;
  toUpdate: number;
  withoutSubcategory: number;
  skippedCount: number;
  // Підкатегорії, яких ще нема в БД — будуть створені як дочірні категорії при імпорті.
  newSubcategories: string[];
  // Значення з колонки "Підкатегорія", які не вдалося зіставити ні з існуючою,
  // ні з новою категорією (діагностика — у нормі має бути порожнім).
  unmatchedSubcategories: string[];
};

export type ImportCommitResult = {
  created: number;
  updated: number;
  failed: { key: string; reason: string }[];
};

export type ImportResponse = {
  summary: ImportSummary;
  skippedRows: ImportSkippedRow[];
  commit?: ImportCommitResult;
};
