import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkEmailDomain, clearEmailDomainCache, type EmailResolver } from "./email-domain";

const err = (code: string) => Object.assign(new Error(code), { code });

function resolver(p: Partial<Record<keyof EmailResolver, () => Promise<unknown[]>>>): EmailResolver {
  const none = () => Promise.reject(err("ENODATA"));
  return {
    resolveMx: p.resolveMx ?? none,
    resolve4: p.resolve4 ?? none,
    resolve6: p.resolve6 ?? none,
  };
}

describe("checkEmailDomain", () => {
  beforeEach(() => clearEmailDomainCache());

  it("ok, якщо є MX", async () => {
    const r = resolver({ resolveMx: async () => [{ exchange: "mx.a.com", priority: 10 }] });
    expect(await checkEmailDomain("a@a.com", { resolver: r })).toBe("ok");
  });

  it("ok, якщо MX немає, але є A", async () => {
    const r = resolver({ resolve4: async () => ["1.2.3.4"] });
    expect(await checkEmailDomain("a@a.com", { resolver: r })).toBe("ok");
  });

  it("ok, якщо є лише AAAA", async () => {
    const r = resolver({ resolve6: async () => ["::1"] });
    expect(await checkEmailDomain("a@a.com", { resolver: r })).toBe("ok");
  });

  it("invalid при ENOTFOUND", async () => {
    const r = resolver({ resolveMx: () => Promise.reject(err("ENOTFOUND")), resolve4: () => Promise.reject(err("ENOTFOUND")), resolve6: () => Promise.reject(err("ENOTFOUND")) });
    expect(await checkEmailDomain("politiksu@gmaildjx.ccn", { resolver: r })).toBe("invalid");
  });

  it("invalid при порожніх списках і без A/AAAA", async () => {
    const r = resolver({ resolveMx: async () => [], resolve4: async () => [], resolve6: async () => [] });
    expect(await checkEmailDomain("a@a.com", { resolver: r })).toBe("invalid");
  });

  it.each(["ESERVFAIL", "ETIMEOUT", "ECONNREFUSED", "EWHATEVER"])("unavailable при %s", async (code) => {
    const r = resolver({ resolveMx: () => Promise.reject(err(code)) });
    expect(await checkEmailDomain("a@a.com", { resolver: r })).toBe("unavailable");
  });

  it("unavailable, якщо MX порожній, а A дає збій", async () => {
    const r = resolver({ resolve4: () => Promise.reject(err("ESERVFAIL")) });
    expect(await checkEmailDomain("a@a.com", { resolver: r })).toBe("unavailable");
  });

  it("unavailable по таймауту", async () => {
    const r = resolver({ resolveMx: () => new Promise(() => {}) });
    expect(await checkEmailDomain("a@a.com", { resolver: r, timeoutMs: 20 })).toBe("unavailable");
  });

  it("не кидає, якщо резолвер кидає синхронно", async () => {
    const r = { resolveMx: () => { throw new Error("boom"); }, resolve4: async () => [], resolve6: async () => [] } as EmailResolver;
    expect(await checkEmailDomain("a@a.com", { resolver: r })).toBe("unavailable");
  });

  it("кешує результат, але не збої", async () => {
    const mx = vi.fn(async () => [{}]);
    const r = resolver({ resolveMx: mx });
    await checkEmailDomain("a@Cache.com", { resolver: r });
    await checkEmailDomain("b@cache.com", { resolver: r });
    expect(mx).toHaveBeenCalledTimes(1);

    const bad = vi.fn(() => Promise.reject(err("ESERVFAIL")));
    const r2 = resolver({ resolveMx: bad });
    await checkEmailDomain("a@fail.com", { resolver: r2 });
    await checkEmailDomain("a@fail.com", { resolver: r2 });
    expect(bad).toHaveBeenCalledTimes(2);
  });

  it("кеш обмежений 500 записами", async () => {
    const mx = vi.fn(async () => [{}]);
    const r = resolver({ resolveMx: mx });
    for (let i = 0; i < 501; i += 1) await checkEmailDomain(`a@d${i}.com`, { resolver: r });
    await checkEmailDomain("a@d0.com", { resolver: r }); // витіснений, резолвиться знову
    expect(mx).toHaveBeenCalledTimes(502);
  });
});
