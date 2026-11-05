"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import {
  IMPORT_TARGET_FIELDS,
  IMPORT_TARGET_FIELD_LABELS,
  type ImportResponse,
  type ImportRowInput,
  type ImportTargetField,
} from "@/lib/admin/import-schema";

type ParentCategory = { id: string; name: string };

type Step = "upload" | "mapping" | "summary" | "done";

const PREVIEW_ROWS = 5;
const NO_CRM_VALUE = "";

const GUESS_RULES: { field: ImportTargetField; keywords: string[] }[] = [
  { field: "name", keywords: ["назв", "наимен", "name", "товар"] },
  { field: "sku", keywords: ["артикул", "sku", "арт"] },
  { field: "price", keywords: ["цена", "ціна", "price"] },
  { field: "stock", keywords: ["остат", "залиш", "кільк", "кол-во", "qty", "stock"] },
  // Перевіряємо ПЕРЕД crmCategory: "subcategory"/"підкатегорія" містять
  // підрядок "category"/"категор", тож при зворотному порядку правило
  // crmCategory перехопило б цю колонку першим.
  { field: "subcategory", keywords: ["підкатегор", "субкатегор", "subcategory", "sub-category"] },
  { field: "crmCategory", keywords: ["категор", "category"] },
  { field: "size", keywords: ["размер", "розм", "size"] },
  { field: "color", keywords: ["цвет", "колір", "color"] },
];

function guessColumnMapping(headers: string[]): ImportTargetField[] {
  const used = new Set<ImportTargetField>();
  return headers.map((header) => {
    const lower = header.toLowerCase();
    for (const rule of GUESS_RULES) {
      if (used.has(rule.field)) continue;
      if (rule.keywords.some((kw) => lower.includes(kw))) {
        used.add(rule.field);
        return rule.field;
      }
    }
    return "ignore";
  });
}

function guessCategoryId(crmValue: string, categories: ParentCategory[]): string {
  const lower = crmValue.toLowerCase();
  if (/жін|жен|female/.test(lower)) {
    return categories.find((c) => c.name.toLowerCase().includes("жін"))?.id ?? "";
  }
  if (/чол|муж|male/.test(lower)) {
    return categories.find((c) => c.name.toLowerCase().includes("чол"))?.id ?? "";
  }
  return "";
}

function selectClass() {
  return "w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:border-neutral-500 focus:outline-none";
}

export function ImportWizard({ parentCategories }: { parentCategories: ParentCategory[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<ImportTargetField[]>([]);
  const [categoryMapping, setCategoryMapping] = useState<Record<string, string>>({});

  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryResult, setSummaryResult] = useState<ImportResponse | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<ImportResponse | null>(null);

  const crmColumnIndex = columnMapping.indexOf("crmCategory");

  const crmValues = useMemo(() => {
    if (headers.length === 0) return [];
    if (crmColumnIndex === -1) return [NO_CRM_VALUE];
    const set = new Set<string>();
    let hasBlank = false;
    for (const row of rows) {
      const value = (row[crmColumnIndex] ?? "").trim();
      if (value) set.add(value);
      else hasBlank = true;
    }
    const values = Array.from(set).sort();
    return hasBlank ? [...values, NO_CRM_VALUE] : values;
  }, [rows, crmColumnIndex, headers.length]);

  function ensureCategoryMappingDefaults(values: string[]) {
    setCategoryMapping((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const value of values) {
        if (!(value in next)) {
          next[value] = guessCategoryId(value, parentCategories);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }

  async function handleFile(file: File) {
    setParseError(null);
    const isExcel = /\.(xlsx|xls)$/i.test(file.name);
    if (!isExcel) {
      setParseError("Підтримуються тільки файли .xlsx / .xls");
      return;
    }
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error("У файлі немає аркушів");
      const sheet = workbook.Sheets[sheetName];
      const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
      const nonEmptyMatrix = matrix.filter((row) => row.some((cell) => String(cell).trim() !== ""));
      if (nonEmptyMatrix.length < 2) throw new Error("У файлі немає рядків з даними");

      const [headerRow, ...dataRows] = nonEmptyMatrix;
      const parsedHeaders = headerRow.map((cell, i) => String(cell).trim() || `Колонка ${i + 1}`);
      const parsedRows = dataRows.map((row) => parsedHeaders.map((_, i) => String(row[i] ?? "").trim()));

      const mapping = guessColumnMapping(parsedHeaders);
      setFileName(file.name);
      setHeaders(parsedHeaders);
      setRows(parsedRows);
      setColumnMapping(mapping);
      setCategoryMapping({});
      setSummaryResult(null);
      setCommitResult(null);

      const crmIndex = mapping.indexOf("crmCategory");
      const initialCrmValues =
        crmIndex === -1
          ? [NO_CRM_VALUE]
          : Array.from(new Set(parsedRows.map((row) => (row[crmIndex] ?? "").trim()))).map(
              (v) => v || NO_CRM_VALUE
            );
      ensureCategoryMappingDefaults(Array.from(new Set(initialCrmValues)));

      setStep("mapping");
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Не вдалося прочитати файл");
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function updateColumnMapping(index: number, field: ImportTargetField) {
    setColumnMapping((prev) => {
      const next = [...prev];
      next[index] = field;
      return next;
    });
  }

  function resetAll() {
    setStep("upload");
    setFileName(null);
    setHeaders([]);
    setRows([]);
    setColumnMapping([]);
    setCategoryMapping({});
    setSummaryResult(null);
    setCommitResult(null);
    setApiError(null);
    setParseError(null);
  }

  function buildRowsPayload(): ImportRowInput[] {
    const fieldIndex: Partial<Record<ImportTargetField, number>> = {};
    columnMapping.forEach((field, i) => {
      if (field !== "ignore") fieldIndex[field] = i;
    });
    return rows.map((row, i) => ({
      rowNumber: i + 2,
      name: fieldIndex.name !== undefined ? row[fieldIndex.name] : undefined,
      sku: fieldIndex.sku !== undefined ? row[fieldIndex.sku] : undefined,
      price: fieldIndex.price !== undefined ? row[fieldIndex.price] : undefined,
      stock: fieldIndex.stock !== undefined ? row[fieldIndex.stock] : undefined,
      crmCategory: fieldIndex.crmCategory !== undefined ? row[fieldIndex.crmCategory] : undefined,
      subcategory: fieldIndex.subcategory !== undefined ? row[fieldIndex.subcategory] : undefined,
      size: fieldIndex.size !== undefined ? row[fieldIndex.size] : undefined,
      color: fieldIndex.color !== undefined ? row[fieldIndex.color] : undefined,
    }));
  }

  async function runImportRequest(dryRun: boolean) {
    setApiError(null);
    if (dryRun) setIsLoadingSummary(true);
    else setIsCommitting(true);
    try {
      const response = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun, categoryMapping, rows: buildRowsPayload() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "Не вдалося виконати імпорт");
      if (dryRun) {
        setSummaryResult(data);
        setStep("summary");
      } else {
        setCommitResult(data);
        setStep("done");
        router.refresh();
      }
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Сталася помилка");
    } finally {
      setIsLoadingSummary(false);
      setIsCommitting(false);
    }
  }

  const hasName = columnMapping.includes("name");
  const hasPrice = columnMapping.includes("price");
  const canComputeSummary = hasName && hasPrice && rows.length > 0;

  return (
    <div className="max-w-4xl space-y-6">
      {step === "upload" && (
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-sm text-neutral-500",
              isDragging ? "border-neutral-500 bg-neutral-50" : "border-neutral-300 hover:border-neutral-400"
            )}
          >
            <p className="font-medium text-neutral-700">Перетягніть файл сюди або натисніть, щоб обрати</p>
            <p className="mt-1 text-xs text-neutral-400">Excel: .xlsx, .xls</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void handleFile(file);
            }}
          />
          {parseError && <p className="mt-3 text-sm text-red-600">{parseError}</p>}
        </div>
      )}

      {step === "mapping" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              Файл: <span className="font-medium text-neutral-900">{fileName}</span> · {rows.length} рядків
            </p>
            <button type="button" onClick={resetAll} className="text-sm text-neutral-600 hover:underline">
              Обрати інший файл
            </button>
          </div>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-neutral-900">Зіставлення колонок</h2>
            <div className="overflow-x-auto rounded-lg border border-neutral-200">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
                  <tr>
                    {headers.map((header, i) => (
                      <th key={i} className="min-w-[160px] px-3 py-2 font-medium">
                        <div className="mb-1 truncate" title={header}>
                          {header}
                        </div>
                        <select
                          value={columnMapping[i] ?? "ignore"}
                          onChange={(e) => updateColumnMapping(i, e.target.value as ImportTargetField)}
                          className={selectClass()}
                        >
                          {IMPORT_TARGET_FIELDS.map((field) => (
                            <option key={field} value={field}>
                              {IMPORT_TARGET_FIELD_LABELS[field]}
                            </option>
                          ))}
                        </select>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, PREVIEW_ROWS).map((row, i) => (
                    <tr key={i} className="border-b border-neutral-100 text-neutral-700 last:border-0">
                      {row.map((cell, j) => (
                        <td key={j} className="max-w-[220px] truncate px-3 py-2" title={cell}>
                          {cell || <span className="text-neutral-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!hasName && <p className="mt-2 text-xs text-red-600">Оберіть колонку з назвою товару</p>}
            {!hasPrice && <p className="mt-2 text-xs text-red-600">Оберіть колонку з ціною</p>}
          </section>

          {crmValues.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-neutral-900">
                Категорія з CRM → батьківська категорія сайту
              </h2>
              <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
                {crmValues.map((value) => (
                  <div key={value} className="flex items-center gap-3">
                    <span className="w-64 truncate text-sm text-neutral-700">
                      {value || (crmColumnIndex === -1 ? "Усі товари (колонку не вказано)" : "(порожнє значення)")}
                    </span>
                    <select
                      value={categoryMapping[value] ?? ""}
                      onChange={(e) =>
                        setCategoryMapping((prev) => ({ ...prev, [value]: e.target.value }))
                      }
                      className={cn(selectClass(), "max-w-xs")}
                    >
                      <option value="">— пропустити товари з цим значенням —</option>
                      {parentCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </section>
          )}

          {apiError && <p className="text-sm text-red-600">{apiError}</p>}

          <button
            type="button"
            onClick={() => runImportRequest(true)}
            disabled={!canComputeSummary || isLoadingSummary}
            className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            {isLoadingSummary ? "Підрахунок…" : "Показати підсумок"}
          </button>
        </div>
      )}

      {step === "summary" && summaryResult && (
        <div className="space-y-6">
          <SummaryStats summary={summaryResult.summary} />

          {summaryResult.summary.newSubcategories.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-neutral-900">
                Будуть автоматично створені підкатегорії ({summaryResult.summary.newSubcategories.length})
              </h2>
              <ul className="rounded-lg border border-neutral-200 p-3 text-sm text-neutral-700">
                {summaryResult.summary.newSubcategories.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </section>
          )}

          {summaryResult.summary.unmatchedSubcategories.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-red-700">
                Значення підкатегорії без відповідності ({summaryResult.summary.unmatchedSubcategories.length})
              </h2>
              <ul className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {summaryResult.summary.unmatchedSubcategories.map((value) => (
                  <li key={value}>{value || "(порожнє значення)"}</li>
                ))}
              </ul>
            </section>
          )}

          {summaryResult.skippedRows.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-neutral-900">
                Пропущені рядки ({summaryResult.skippedRows.length})
              </h2>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-neutral-200">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Рядок</th>
                      <th className="px-3 py-2 font-medium">Назва</th>
                      <th className="px-3 py-2 font-medium">Причина</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryResult.skippedRows.map((row, i) => (
                      <tr key={i} className="border-b border-neutral-100 last:border-0">
                        <td className="px-3 py-2">{row.rowNumber}</td>
                        <td className="px-3 py-2">{row.name || "—"}</td>
                        <td className="px-3 py-2 text-red-600">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {apiError && <p className="text-sm text-red-600">{apiError}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("mapping")}
              className="rounded-lg border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Назад до зіставлення
            </button>
            <button
              type="button"
              onClick={() => runImportRequest(false)}
              disabled={isCommitting || summaryResult.summary.totalProducts === 0}
              className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              {isCommitting ? "Імпортування…" : "Імпортувати"}
            </button>
          </div>
        </div>
      )}

      {step === "done" && commitResult?.commit && (
        <div className="space-y-6">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            Імпорт завершено: створено {commitResult.commit.created}, оновлено {commitResult.commit.updated}
            {commitResult.commit.failed.length > 0 && `, помилок — ${commitResult.commit.failed.length}`}.
          </div>

          {commitResult.commit.failed.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-neutral-900">Помилки під час запису</h2>
              <ul className="space-y-1 text-sm text-red-600">
                {commitResult.commit.failed.map((f, i) => (
                  <li key={i}>
                    {f.key}: {f.reason}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={resetAll}
              className="rounded-lg border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Новий імпорт
            </button>
            <Link
              href="/admin/products"
              className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Перейти до товарів
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryStats({ summary }: { summary: NonNullable<ImportResponse["summary"]> }) {
  const items: { label: string; value: number }[] = [
    { label: "Рядків у файлі", value: summary.totalRows },
    { label: "Товарів усього", value: summary.totalProducts },
    { label: "Буде створено", value: summary.toCreate },
    { label: "Буде оновлено (за SKU)", value: summary.toUpdate },
    { label: "Без підкатегорії", value: summary.withoutSubcategory },
    { label: "Пропущено", value: summary.skippedCount },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-neutral-200 p-3">
          <p className="text-2xl font-semibold text-neutral-900">{item.value}</p>
          <p className="text-xs text-neutral-500">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
