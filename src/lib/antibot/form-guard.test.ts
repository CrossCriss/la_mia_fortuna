import { describe, it, expect } from "vitest";
import { checkFormGuard, MIN_FILL_MS } from "./form-guard";

describe("checkFormGuard", () => {
  it("MIN_FILL_MS дорівнює 4000", () => {
    expect(MIN_FILL_MS).toBe(4000);
  });

  it("пуста ловушка і 5000 мс проходять", () => {
    expect(checkFormGuard({ honeypot: "", fillMs: 5000 })).toEqual({ ok: true });
  });

  it("ловушка з текстом блокується як HONEYPOT", () => {
    expect(checkFormGuard({ honeypot: "x", fillMs: 5000 })).toEqual({
      ok: false,
      reason: "HONEYPOT",
    });
  });

  it("пробіли в ловушці не вважаються заповненням", () => {
    expect(checkFormGuard({ honeypot: "   ", fillMs: 5000 })).toEqual({ ok: true });
  });

  it("ловушка перевіряється раніше за час", () => {
    expect(checkFormGuard({ honeypot: "x", fillMs: 100 })).toEqual({
      ok: false,
      reason: "HONEYPOT",
    });
  });

  it("3999 мс блокується як TOO_FAST", () => {
    expect(checkFormGuard({ honeypot: "", fillMs: 3999 })).toEqual({
      ok: false,
      reason: "TOO_FAST",
    });
  });

  it("відсутній fillMs блокується як TOO_FAST", () => {
    expect(checkFormGuard({ honeypot: "" })).toEqual({ ok: false, reason: "TOO_FAST" });
  });
});
