import { describe, expect, it } from "vitest";
import {
  AUTOCOMPLETE_DEBOUNCE_MS,
  CITY_MIN_QUERY_LENGTH,
  WAREHOUSE_MIN_QUERY_LENGTH,
  isAbortError,
  shouldSearch,
} from "./autocomplete";

describe("autocomplete", () => {
  it("uses 400 ms debounce", () => {
    expect(AUTOCOMPLETE_DEBOUNCE_MS).toBe(400);
  });

  it("city needs 2 characters", () => {
    expect(shouldSearch("К", CITY_MIN_QUERY_LENGTH)).toBe(false);
    expect(shouldSearch("Ки", CITY_MIN_QUERY_LENGTH)).toBe(true);
  });

  it("warehouse searches by a single digit", () => {
    expect(shouldSearch("5", WAREHOUSE_MIN_QUERY_LENGTH)).toBe(true);
    expect(shouldSearch("   ", WAREHOUSE_MIN_QUERY_LENGTH)).toBe(false);
    expect(shouldSearch("", WAREHOUSE_MIN_QUERY_LENGTH)).toBe(false);
  });

  it("detects abort errors", () => {
    expect(isAbortError(new DOMException("x", "AbortError"))).toBe(true);
    expect(isAbortError(new Error("x"))).toBe(false);
    expect(isAbortError(null)).toBe(false);
  });
});
