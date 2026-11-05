import { prisma } from "@/lib/prisma";
import { slugify, uniqueSlug } from "./slugify";
import { NO_COLOR_NAME } from "@/lib/color-print";
import type {
  ImportCommitResult,
  ImportRequest,
  ImportResponse,
  ImportRowInput,
  ImportSkippedRow,
  ImportSummary,
} from "./import-schema";

const DEFAULT_SIZE_VALUE = "Без розміру";
const DEFAULT_COLOR_HEX = "#CCCCCC";

// Запасний варіант — розпізнавання підкатегорії з назви товару за ключовими
// словами. Використовується лише коли в рядку немає значення в колонці
// "Підкатегорія" (файли без цієї колонки).
const SUBCATEGORY_KEYWORD_RULES: { keywords: string[]; subcategoryName: string }[] = [
  { keywords: ["бюстгальтер", "ліфчик", "лифчик"], subcategoryName: "Бюстгальтери" },
  { keywords: ["труси", "трусы"], subcategoryName: "Труси" },
  { keywords: ["піжам", "пижам"], subcategoryName: "Піжами" },
  { keywords: ["комплект"], subcategoryName: "Комплекти" },
];

function detectSubcategoryNameFromProductName(productName: string): string | null {
  const lower = productName.toLowerCase();
  for (const rule of SUBCATEGORY_KEYWORD_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) return rule.subcategoryName;
  }
  return null;
}

// Excel-комірки іноді містять нерозривні пробіли (U+00A0) або подвійні
// пробіли, через які однакові на вигляд назви не збігаються при порівнянні.
function normalizeText(value: string): string {
  return value.replace(/ /g, " ").trim().replace(/\s+/g, " ");
}

// Джерело істини — колонка "Підкатегорія" з файлу, якщо вона зіставлена і
// заповнена. Розпізнавання за назвою товару — лише запасний варіант.
function resolveSubcategoryName(row: ImportRowInput, productName: string): string | null {
  const explicit = normalizeText(row.subcategory ?? "");
  if (explicit) return explicit;
  return detectSubcategoryNameFromProductName(productName);
}

function parsePrice(raw?: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d.,-]/g, "").replace(",", ".");
  if (!cleaned) return null;
  const value = parseFloat(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}

function parseStock(raw?: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[^\d-]/g, "");
  const value = parseInt(cleaned, 10);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function generateSku(name: string, taken: Set<string>): string {
  const base = slugify(name).toUpperCase().replace(/-/g, "").slice(0, 10) || "PROD";
  let candidate = `IMP-${base}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  while (taken.has(candidate)) {
    candidate = `IMP-${base}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  }
  return candidate;
}

type CategoryNode = { id: string; name: string; children: { id: string; name: string }[] };

type PendingSubcategory = { parentCategoryId: string; parentName: string; name: string };

const PENDING_PREFIX = "__pending_subcategory__::";

function pendingSubcategoryKey(parentCategoryId: string, subcategoryName: string): string {
  return `${PENDING_PREFIX}${parentCategoryId}::${subcategoryName.toLowerCase()}`;
}

type ValidatedGroup = {
  key: string;
  sku: string | null;
  name: string;
  price: number;
  // Реальний id категорії, або тимчасовий ключ pendingSubcategoryKey(), якщо
  // підкатегорія ще не існує в БД і буде створена в commitGroups().
  categoryId: string;
  usedSubcategory: boolean;
  variantRows: { rowNumber: number; size: string; color: string; stock: number }[];
};

// Один рядок файлу = один варіант товару. Рядки з однаковим (непорожнім)
// SKU групуються в один товар з кількома варіантами розмір/колір — так
// CRM-експорт "по рядку на розмір" перетворюється на Product+ProductVariant[].
function groupRows(
  rows: ImportRowInput[],
  categoryMapping: Record<string, string>,
  categoriesById: Map<string, CategoryNode>
): {
  groups: ValidatedGroup[];
  skipped: ImportSkippedRow[];
  newSubcategories: Map<string, PendingSubcategory>;
  unmatchedSubcategories: Set<string>;
} {
  const skipped: ImportSkippedRow[] = [];
  const groupsByKey = new Map<string, ValidatedGroup>();
  const order: string[] = [];
  const newSubcategories = new Map<string, PendingSubcategory>();
  const unmatchedSubcategories = new Set<string>();

  for (const row of rows) {
    const name = (row.name ?? "").trim();
    if (!name) {
      skipped.push({ rowNumber: row.rowNumber, reason: "Немає назви товару" });
      continue;
    }

    const price = parsePrice(row.price);
    if (price === null) {
      skipped.push({ rowNumber: row.rowNumber, name, reason: "Немає коректної ціни" });
      continue;
    }

    const crmValue = (row.crmCategory ?? "").trim();
    const parentCategoryId = categoryMapping[crmValue];
    const parentCategory = parentCategoryId ? categoriesById.get(parentCategoryId) : undefined;
    if (!parentCategory) {
      skipped.push({
        rowNumber: row.rowNumber,
        name,
        reason: crmValue ? `Категорію CRM "${crmValue}" не зіставлено` : "Не вказано категорію CRM",
      });
      continue;
    }

    const subcategoryName = resolveSubcategoryName(row, name);
    let categoryId = parentCategory.id;
    let usedSubcategory = false;

    if (subcategoryName) {
      const normalizedTarget = subcategoryName.toLowerCase();
      const child = parentCategory.children.find(
        (c) => normalizeText(c.name).toLowerCase() === normalizedTarget
      );
      if (child) {
        categoryId = child.id;
        usedSubcategory = true;
      } else {
        // Такої дочірньої категорії ще нема — створимо її при commit,
        // а не лишаємо товар без підкатегорії.
        const key = pendingSubcategoryKey(parentCategory.id, subcategoryName);
        if (!newSubcategories.has(key)) {
          newSubcategories.set(key, {
            parentCategoryId: parentCategory.id,
            parentName: parentCategory.name,
            name: subcategoryName,
          });
        }
        categoryId = key;
        usedSubcategory = true;
      }
    } else {
      const rawSubcategory = normalizeText(row.subcategory ?? "");
      if (rawSubcategory) unmatchedSubcategories.add(rawSubcategory);
    }

    const sku = (row.sku ?? "").trim() || null;
    const key = sku ?? `__row_${row.rowNumber}`;

    let group = groupsByKey.get(key);
    if (!group) {
      group = { key, sku, name, price, categoryId, usedSubcategory, variantRows: [] };
      groupsByKey.set(key, group);
      order.push(key);
    }
    group.variantRows.push({
      rowNumber: row.rowNumber,
      size: (row.size ?? "").trim(),
      color: (row.color ?? "").trim(),
      stock: parseStock(row.stock),
    });
  }

  return {
    groups: order.map((key) => groupsByKey.get(key)!),
    skipped,
    newSubcategories,
    unmatchedSubcategories,
  };
}

function makeSizeResolver(initialSizes: { id: string; value: string; sortOrder: number }[]) {
  const cache = new Map(initialSizes.map((s) => [s.value.toLowerCase(), s.id]));
  let nextSort = initialSizes.reduce((max, s) => Math.max(max, s.sortOrder), -1) + 1;
  return async function resolveSize(rawValue: string): Promise<string> {
    const value = rawValue || DEFAULT_SIZE_VALUE;
    const key = value.toLowerCase();
    const cached = cache.get(key);
    if (cached) return cached;
    const created = await prisma.size.create({ data: { value, sortOrder: nextSort++ } });
    cache.set(key, created.id);
    return created.id;
  };
}

function makeColorResolver(initialColors: { id: string; name: string }[]) {
  const cache = new Map(initialColors.map((c) => [c.name.toLowerCase(), c.id]));
  return async function resolveColor(rawValue: string): Promise<string> {
    const value = rawValue || NO_COLOR_NAME;
    const key = value.toLowerCase();
    const cached = cache.get(key);
    if (cached) return cached;
    const created = await prisma.color.create({ data: { name: value, hex: DEFAULT_COLOR_HEX } });
    cache.set(key, created.id);
    return created.id;
  };
}

// Виконує dry-run (тільки підрахунок, без запису) або реальний імпорт —
// та ж логіка групування/зіставлення категорій, різниця лише в тому, чи
// пишемо результат у БД.
export async function runImport(input: ImportRequest): Promise<ImportResponse> {
  const categories = await prisma.category.findMany({
    include: { children: { select: { id: true, name: true } } },
  });
  const categoriesById = new Map<string, CategoryNode>(
    categories.map((c) => [c.id, { id: c.id, name: c.name, children: c.children }])
  );

  const { groups, skipped, newSubcategories, unmatchedSubcategories } = groupRows(
    input.rows,
    input.categoryMapping,
    categoriesById
  );

  const skusToCheck = groups.map((g) => g.sku).filter((sku): sku is string => !!sku);
  const existing = skusToCheck.length
    ? await prisma.product.findMany({ where: { sku: { in: skusToCheck } }, select: { id: true, sku: true } })
    : [];
  const existingBySku = new Map(existing.map((p) => [p.sku, p.id]));

  const summary: ImportSummary = {
    totalRows: input.rows.length,
    totalProducts: groups.length,
    toCreate: groups.filter((g) => !g.sku || !existingBySku.has(g.sku)).length,
    toUpdate: groups.filter((g) => g.sku && existingBySku.has(g.sku)).length,
    withoutSubcategory: groups.filter((g) => !g.usedSubcategory).length,
    skippedCount: skipped.length,
    newSubcategories: Array.from(newSubcategories.values()).map(
      (entry) => `${entry.parentName} → ${entry.name}`
    ),
    unmatchedSubcategories: Array.from(unmatchedSubcategories),
  };

  const commit = input.dryRun
    ? undefined
    : await commitGroups(groups, existingBySku, newSubcategories);

  return { summary, skippedRows: skipped, commit };
}

async function commitGroups(
  groups: ValidatedGroup[],
  existingBySku: Map<string, string>,
  newSubcategories: Map<string, PendingSubcategory>
): Promise<ImportCommitResult> {
  const [sizes, colors, allProducts, allCategories] = await Promise.all([
    prisma.size.findMany(),
    prisma.color.findMany(),
    prisma.product.findMany({ select: { slug: true, sku: true } }),
    prisma.category.findMany({ select: { slug: true } }),
  ]);

  const resolveSize = makeSizeResolver(sizes);
  const resolveColor = makeColorResolver(colors);
  const usedSlugs = new Set(allProducts.map((p) => p.slug));
  const usedSkus = new Set(allProducts.map((p) => p.sku));
  const usedCategorySlugs = new Set(allCategories.map((c) => c.slug));

  // Створюємо всі відсутні підкатегорії до запису товарів одним проходом —
  // кілька товарів з однією й тією ж новою підкатегорією мають отримати
  // один і той самий id, а не по дублікату категорії на товар.
  const resolvedPendingCategoryIds = new Map<string, string>();
  for (const [key, pending] of newSubcategories) {
    const slug = uniqueSlug(slugify(pending.name), usedCategorySlugs);
    const createdCategory = await prisma.category.create({
      data: { name: pending.name, slug, parentId: pending.parentCategoryId, kind: "REGULAR" },
    });
    resolvedPendingCategoryIds.set(key, createdCategory.id);
  }

  let created = 0;
  let updated = 0;
  const failed: ImportCommitResult["failed"] = [];

  for (const group of groups) {
    try {
      const categoryId = resolvedPendingCategoryIds.get(group.categoryId) ?? group.categoryId;

      // Останній рядок з тим самим розміром+кольором перемагає — файл може
      // містити повторні рядки для одного варіанту з оновленим залишком.
      const variantByKey = new Map<string, { size: string; color: string; stock: number }>();
      for (const v of group.variantRows) {
        variantByKey.set(`${v.size.toLowerCase()}|${v.color.toLowerCase()}`, v);
      }

      const resolvedVariants: { sizeId: string; colorId: string; stock: number }[] = [];
      for (const v of variantByKey.values()) {
        const sizeId = await resolveSize(v.size);
        const colorId = await resolveColor(v.color);
        resolvedVariants.push({ sizeId, colorId, stock: v.stock });
      }

      const existingId = group.sku ? existingBySku.get(group.sku) : undefined;

      if (existingId) {
        await prisma.product.update({
          where: { id: existingId },
          data: { name: group.name, price: group.price, categoryId },
        });
        for (const v of resolvedVariants) {
          await prisma.productVariant.upsert({
            where: {
              productId_sizeId_colorId: { productId: existingId, sizeId: v.sizeId, colorId: v.colorId },
            },
            update: { stock: v.stock },
            create: { productId: existingId, sizeId: v.sizeId, colorId: v.colorId, stock: v.stock },
          });
        }
        updated += 1;
      } else {
        const slug = uniqueSlug(slugify(group.name), usedSlugs);
        const sku = group.sku ?? generateSku(group.name, usedSkus);
        usedSkus.add(sku);
        await prisma.product.create({
          data: {
            name: group.name,
            slug,
            sku,
            categoryId,
            price: group.price,
            isPublished: true,
            variants: { create: resolvedVariants },
          },
        });
        created += 1;
      }
    } catch (error) {
      failed.push({ key: group.key, reason: error instanceof Error ? error.message : "Невідома помилка" });
    }
  }

  return { created, updated, failed };
}
