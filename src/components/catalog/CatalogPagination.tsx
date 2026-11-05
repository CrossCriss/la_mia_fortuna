import Link from "next/link";
import { cn } from "@/lib/utils";

type SearchParams = Record<string, string | undefined>;

function pageHref(searchParams: SearchParams, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || !value) continue;
    params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

// Компактна пагінація: перша/остання сторінка завжди видимі, навколо поточної —
// вікно ±2, решта згорнута в "…". Категорії верхнього рівня можуть містити
// сотні товарів (усі підкатегорії разом), тож кількість сторінок буває чималою.
function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  const pages = new Set<number>([1, totalPages]);
  for (let p = currentPage - 2; p <= currentPage + 2; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  const sorted = Array.from(pages).sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("ellipsis");
    result.push(p);
    prev = p;
  }
  return result;
}

export function CatalogPagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: SearchParams;
}) {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Пагінація">
      <PageLink
        page={currentPage - 1}
        disabled={currentPage <= 1}
        searchParams={searchParams}
        label="← Назад"
      />

      {pageNumbers.map((entry, i) =>
        entry === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-neutral-400">
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={pageHref(searchParams, entry)}
            aria-current={entry === currentPage ? "page" : undefined}
            className={cn(
              "min-w-9 rounded-lg px-3 py-1.5 text-center text-sm transition-colors duration-150 ease-out",
              entry === currentPage
                ? "bg-neutral-900 text-white"
                : "text-neutral-700 hover:bg-neutral-100"
            )}
          >
            {entry}
          </Link>
        )
      )}

      <PageLink
        page={currentPage + 1}
        disabled={currentPage >= totalPages}
        searchParams={searchParams}
        label="Вперед →"
      />
    </nav>
  );
}

function PageLink({
  page,
  disabled,
  searchParams,
  label,
}: {
  page: number;
  disabled: boolean;
  searchParams: SearchParams;
  label: string;
}) {
  if (disabled) {
    return <span className="px-3 py-1.5 text-sm text-neutral-300">{label}</span>;
  }
  return (
    <Link
      href={pageHref(searchParams, page)}
      className="rounded-lg px-3 py-1.5 text-sm text-neutral-700 transition-colors duration-150 ease-out hover:bg-neutral-100"
    >
      {label}
    </Link>
  );
}
