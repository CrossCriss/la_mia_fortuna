// Частина товарів (переважно "Боксери …") має не колір, а унікальний
// принт ("Акули", "Динозаври") — Color у БД для них лишається технічним
// заповнювачем NO_COLOR_NAME ("Без кольору"), бо в файлі CRM для цих
// рядків колонка "колір" була порожня. Справжня назва малюнка живе лише
// в назві товару. Це єдине джерело істини для розрізнення "реальний
// колір" / "принт", яке використовують і фільтри каталогу
// (CatalogFilters, /catalog/[categorySlug]), і вибір варіанту на картці
// товару (ProductOptions) — див. import-service.ts, де цей самий
// NO_COLOR_NAME проставляється як fallback при імпорті.
export const NO_COLOR_NAME = "Без кольору";
// Той самий принцип, що й NO_COLOR_NAME, але для розміру — товари без
// реального розміру (шкарпетки, "таємні бокси" тощо) отримують цей
// технічний заповнювач при імпорті (див. DEFAULT_SIZE_VALUE в
// import-service.ts). У кошику/чекауті такий розмір показувати не треба.
export const NO_SIZE_NAME = "Без розміру";

export function isRealColorName(name: string): boolean {
  return name.trim().toLowerCase() !== NO_COLOR_NAME.toLowerCase();
}

export function isRealSizeName(name: string): boolean {
  return name.trim().toLowerCase() !== NO_SIZE_NAME.toLowerCase();
}

// Формує підпис "розмір / колір" для кошика й чекауту, пропускаючи
// частини, що є лише технічними заповнювачами (без розміру/без кольору).
// Повертає null, якщо показувати нічого не треба.
export function formatVariantLabel(size: string, color: string): string | null {
  const parts = [
    isRealSizeName(size) ? size : null,
    isRealColorName(color) ? color : null,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(" / ") : null;
}

// Корені кольорових слів (щоб ловити відмінки/роди: чорний/чорна/чорні…).
const COLOR_WORD_ROOTS = [
  "чорн", "біл", "беж", "рожев", "сір", "зелен", "син", "блакитн",
  "молочн", "червон", "жовт", "фіолетов", "лаванд", "лимонн", "мят",
  "персиков", "шоколад", "хакі", "коричнев", "вишнев", "помаранчев",
  "бордов", "нюд", "тілесн", "айворі", "кремов",
];

const PRINT_KEYWORD = /боксер[иі]?/i;

// Слова, що трапляються в назвах після "боксери/боксер", але не є ні
// кольором, ні принтом — бренди/лінійки, тканина/крій, службові слова
// набору. Підібрано під фактичний каталог (prisma-дані); нове невідоме
// слово за замовчуванням стає принтом — прийнятний дефолт для чипсів
// фільтра, а не помилка.
const NOISE_WORDS = new Set([
  "боно", "кіс", "брес", "редо", "скін", "аттрактів", "аттрактив",
  "хендсом", "фешн", "обсешн", "аура", "greenice", "грінайс", "котонін",
  "бамбук", "бавовна", "бавовняні", "безшовні", "безшовний",
  "мікробезшовні", "мікрорубчик", "рубчик", "базові", "базовий", "базова",
  "soft", "touch",
  "набір", "шт", "мен", "нові", "новий", "нова", "нове", "новорічні",
  "кольорові", "різнокольорові", "однотон", "для", "настрою",
]);

function normalizeWord(token: string): string {
  return token.replace(/['’‘ʼ`]/g, "").toLowerCase();
}

function isColorWord(token: string): boolean {
  const normalized = normalizeWord(token);
  return COLOR_WORD_ROOTS.some((root) => normalized.startsWith(root));
}

// Витягує назву принта з назви товару за словом "боксери"/"боксер" — це
// єдиний товарний тип, для якого просили розпізнавання принта з назви.
export function derivePrintLabel(productName: string): string | null {
  const match = productName.match(PRINT_KEYWORD);
  if (!match || match.index === undefined) return null;

  const remainder = productName.slice(match.index + match[0].length).replace(/[()№]/g, " ");

  const significant = remainder
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => token.replace(/^\d+/, ""))
    .filter((token) => {
      if (!token) return false;
      const normalized = normalizeWord(token);
      if (!normalized || /^\d+$/.test(normalized)) return false;
      if (NOISE_WORDS.has(normalized)) return false;
      if (isColorWord(token)) return false;
      return true;
    });

  if (significant.length === 0) return null;

  return significant
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(" ");
}

export type VariantOptionKind = "color" | "print" | "hidden";

// Спільна класифікація для одного варіанту товару: реальний колір
// (кружок-свотч), розпізнаний принт (текстовий чип) або "hidden" —
// ні кольору, ні принта нема, показувати нічого не потрібно.
export function classifyVariantOption(
  colorName: string,
  productName: string
): { kind: VariantOptionKind; label: string } {
  if (isRealColorName(colorName)) {
    return { kind: "color", label: colorName };
  }
  const printLabel = derivePrintLabel(productName);
  if (printLabel) {
    return { kind: "print", label: printLabel };
  }
  return { kind: "hidden", label: colorName };
}
