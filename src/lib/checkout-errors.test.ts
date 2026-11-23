import { describe, expect, it } from "vitest";
import {
  CHECKOUT_ERROR_CODES,
  codReasonToCode,
  getCheckoutErrorMessage,
} from "./checkout-errors";

describe("checkout-errors", () => {
  it("BLOCKED і PHONE_LIMIT дають однаковий код і текст", () => {
    const a = codReasonToCode("BLOCKED");
    const b = codReasonToCode("PHONE_LIMIT");
    expect(a).toBe("COD_UNAVAILABLE");
    expect(b).toBe(a);
    for (const onlineEnabled of [true, false]) {
      expect(getCheckoutErrorMessage(a, { onlineEnabled })).toBe(
        getCheckoutErrorMessage(b, { onlineEnabled }),
      );
    }
  });

  it("TOO_MANY_PAIRS має свій код", () => {
    expect(codReasonToCode("TOO_MANY_PAIRS")).toBe("COD_TOO_MANY_PAIRS");
  });

  it("коди дорівнюють ключам", () => {
    for (const [k, v] of Object.entries(CHECKOUT_ERROR_CODES)) expect(v).toBe(k);
  });

  it("у кожного коду є текст для обох значень onlineEnabled, без заборонених слів", () => {
    for (const code of Object.values(CHECKOUT_ERROR_CODES)) {
      for (const onlineEnabled of [true, false]) {
        const text = getCheckoutErrorMessage(code, { onlineEnabled });
        expect(text.length).toBeGreaterThan(0);
        const lower = text.toLowerCase();
        expect(lower).not.toContain("заблок");
        expect(lower).not.toContain("ліміт");
        expect(lower).not.toContain("бот");
      }
    }
  });

  it("число пар береться з політики", () => {
    expect(
      getCheckoutErrorMessage("COD_TOO_MANY_PAIRS", { onlineEnabled: true }),
    ).toContain("до 3 пар");
    expect(
      getCheckoutErrorMessage("COD_TOO_MANY_PAIRS", { onlineEnabled: false }),
    ).toContain("до 3 пар");
  });
});
