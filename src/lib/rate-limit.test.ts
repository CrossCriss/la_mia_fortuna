import { beforeEach, describe, expect, it } from "vitest";
import { getClientIp, rateLimit, resetRateLimitStore } from "./rate-limit";

const WINDOW = 60_000;

describe("rateLimit", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("пропускає перші N запитів і блокує N+1", () => {
    for (let i = 0; i < 5; i += 1) {
      expect(rateLimit("login:1.1.1.1", 5, WINDOW, 1000).allowed).toBe(true);
    }
    const blocked = rateLimit("login:1.1.1.1", 5, WINDOW, 1000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("повертає залишок вікна в секундах", () => {
    rateLimit("k", 1, WINDOW, 0);
    const blocked = rateLimit("k", 1, WINDOW, 15_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(45);
  });

  it("скидає вікно після закінчення часу", () => {
    rateLimit("k", 2, WINDOW, 0);
    rateLimit("k", 2, WINDOW, 1000);
    expect(rateLimit("k", 2, WINDOW, 2000).allowed).toBe(false);
    expect(rateLimit("k", 2, WINDOW, WINDOW - 1).allowed).toBe(false);
    expect(rateLimit("k", 2, WINDOW, WINDOW).allowed).toBe(true);
    expect(rateLimit("k", 2, WINDOW, WINDOW + 1).allowed).toBe(true);
    expect(rateLimit("k", 2, WINDOW, WINDOW + 2).allowed).toBe(false);
  });

  it("різні ключі незалежні", () => {
    rateLimit("a", 1, WINDOW, 0);
    expect(rateLimit("a", 1, WINDOW, 1).allowed).toBe(false);
    expect(rateLimit("b", 1, WINDOW, 1).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  const req = (headers: Record<string, string>) => new Request("http://localhost/x", { headers });

  it("бере перше значення x-forwarded-for без пробілів", () => {
    expect(getClientIp(req({ "x-forwarded-for": "  203.0.113.5 , 10.0.0.1" }))).toBe("203.0.113.5");
  });

  it("повертає одиничне значення", () => {
    expect(getClientIp(req({ "x-forwarded-for": "198.51.100.7" }))).toBe("198.51.100.7");
  });

  it("повертає unknown без заголовка або з порожнім", () => {
    expect(getClientIp(req({}))).toBe("unknown");
    expect(getClientIp(req({ "x-forwarded-for": "  " }))).toBe("unknown");
  });
});
