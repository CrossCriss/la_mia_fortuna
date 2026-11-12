import { describe, it, expect } from "vitest";
import { formatPrice } from "./format-price";

describe("formatPrice", () => {
  it("форматує ціле число без копійок", () => {
    expect(formatPrice(0)).toBe("0 ₴");
    expect(formatPrice(500)).toBe("500 ₴");
  });

  it("ставить пробіл як розділювач тисяч", () => {
    expect(formatPrice(1000)).toBe("1 000 ₴");
    expect(formatPrice(1234567)).toBe("1 234 567 ₴");
  });

  it("показує копійки через кому", () => {
    expect(formatPrice(99.5)).toBe("99,50 ₴");
    expect(formatPrice(1234.56)).toBe("1 234,56 ₴");
  });

  it("приймає рядок як число", () => {
    expect(formatPrice("1500")).toBe("1 500 ₴");
    expect(formatPrice("1500.25")).toBe("1 500,25 ₴");
  });

  it("округлює до копійок", () => {
    expect(formatPrice(10.999)).toBe("11 ₴");
  });
});
