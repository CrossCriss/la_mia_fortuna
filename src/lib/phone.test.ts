import { describe, expect, it } from "vitest";
import {
  UA_MOBILE_CODES,
  formatUaPhone,
  normalizeUaPhone,
  phoneLookupVariants,
} from "./phone";

describe("normalizeUaPhone", () => {
  it.each([
    "0501234567",
    "+380501234567",
    "380501234567",
    "80501234567",
    "+38 (050) 123-45-67",
    "050.123.45.67",
  ])("приводит %s к каноническому виду", (input) => {
    expect(normalizeUaPhone(input)).toBe("380501234567");
  });

  it.each([
    ["городской код 57", "0577001122"],
    ["польский номер", "+48501234567"],
    ["буквы", "050abc4567"],
    ["9 цифр после 0", "050123456"],
    ["11 цифр после 0", "05012345678"],
    ["пусто", ""],
  ])("отклоняет: %s", (_name, input) => {
    expect(normalizeUaPhone(input)).toBeNull();
  });

  it("принимает каждый код из UA_MOBILE_CODES", () => {
    for (const code of UA_MOBILE_CODES) {
      expect(normalizeUaPhone(`0${code}1234567`)).toBe(`380${code}1234567`);
    }
  });
});

describe("phoneLookupVariants", () => {
  it("возвращает три варианта записи", () => {
    expect(phoneLookupVariants("380501234567")).toEqual([
      "380501234567",
      "+380501234567",
      "0501234567",
    ]);
  });
});

describe("formatUaPhone", () => {
  it("форматирует для показа", () => {
    expect(formatUaPhone("380501234567")).toBe("+380 50 123 45 67");
  });
});
