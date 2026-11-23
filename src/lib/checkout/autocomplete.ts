// Чиста логіка автокомпліту міста/відділення Нової Пошти на чекауті.

// Нова Пошта віддає "To many requests" при частих запитах, тому затримка помірна.
export const AUTOCOMPLETE_DEBOUNCE_MS = 400;

// Місто шукаємо від 2 символів, відділення від 1 (номери бувають однозначними).
export const CITY_MIN_QUERY_LENGTH = 2;
export const WAREHOUSE_MIN_QUERY_LENGTH = 1;

export function shouldSearch(query: string, minLength: number): boolean {
  return query.trim().length >= minLength;
}

export function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: unknown }).name === "AbortError"
  );
}
