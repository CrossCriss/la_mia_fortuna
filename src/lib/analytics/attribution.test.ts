import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ATTRIBUTION_STORAGE_KEY,
  mergeAttribution,
  parseAttribution,
  readAttribution,
  writeAttribution,
  type Attribution,
} from "./attribution";

const NOW = new Date("2026-11-23T10:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

describe("parseAttribution", () => {
  it("читає utm-мітки зі строки запиту", () => {
    const result = parseAttribution(
      "?utm_source=instagram&utm_medium=cpc&utm_campaign=autumn&utm_content=reel1&utm_term=bags&fbclid=abc",
      "",
      "/catalog",
      NOW,
    );
    expect(result).toEqual({
      utm_source: "instagram",
      utm_medium: "cpc",
      utm_campaign: "autumn",
      utm_content: "reel1",
      utm_term: "bags",
      fbclid: "abc",
      landing: "/catalog",
      capturedAt: NOW.toISOString(),
    });
  });

  it("повертає об'єкт, якщо є лише fbclid", () => {
    const result = parseAttribution("?fbclid=XYZ", "", "/", NOW);
    expect(result).toEqual({
      fbclid: "XYZ",
      landing: "/",
      capturedAt: NOW.toISOString(),
    });
  });

  it("не включає порожні значення міток", () => {
    const result = parseAttribution("?utm_source=fb&utm_medium=&utm_term=", "", "/", NOW);
    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty("utm_medium");
    expect(result).not.toHaveProperty("utm_term");
  });

  it("повертає null, якщо всі мітки порожні і немає реферера", () => {
    expect(parseAttribution("?utm_source=", "", "/", NOW)).toBeNull();
  });

  it("визначає Instagram за реферером без міток", () => {
    const result = parseAttribution("", "https://l.instagram.com/?u=abc", "/p", NOW);
    expect(result).toEqual({
      utm_source: "instagram",
      utm_medium: "referral",
      landing: "/p",
      referrer: "l.instagram.com",
      capturedAt: NOW.toISOString(),
    });
  });

  it("визначає Facebook за реферером без міток", () => {
    const result = parseAttribution("", "https://m.facebook.com/", "/", NOW);
    expect(result?.utm_source).toBe("facebook");
    expect(result?.utm_medium).toBe("referral");
    expect(result?.referrer).toBe("m.facebook.com");
  });

  it("працює для типових хостів Instagram і Facebook", () => {
    for (const [ref, source] of [
      ["https://l.instagram.com/", "instagram"],
      ["https://instagram.com/", "instagram"],
      ["https://m.facebook.com/", "facebook"],
      ["https://l.facebook.com/l.php?u=x", "facebook"],
      ["https://lm.facebook.com/", "facebook"],
      ["https://fb.com/", "facebook"],
    ] as const) {
      expect(parseAttribution("", ref, "/", NOW)?.utm_source).toBe(source);
    }
  });

  it("не вважає схожі хости соцмережами", () => {
    expect(parseAttribution("", "https://fakeinstagram.com/", "/", NOW)).toBeNull();
    expect(parseAttribution("", "https://instagram.evil.com/", "/", NOW)).toBeNull();
    expect(parseAttribution("", "https://notfacebook.com/", "/", NOW)).toBeNull();
    expect(parseAttribution("", "https://facebook.com.evil.com/", "/", NOW)).toBeNull();
  });

  it("прямий захід дає null", () => {
    expect(parseAttribution("", "", "/", NOW)).toBeNull();
  });

  it("реферер з іншого сайту без міток дає null", () => {
    expect(parseAttribution("", "https://www.google.com/search?q=x", "/", NOW)).toBeNull();
  });

  it("невалідний реферер вважається порожнім", () => {
    expect(parseAttribution("", "not a url instagram.", "/", NOW)).toBeNull();
    const withMarks = parseAttribution("?utm_source=a", "%%%", "/", NOW);
    expect(withMarks).not.toBeNull();
    expect(withMarks).not.toHaveProperty("referrer");
  });

  it("зберігає у referrer лише хост без шляху і параметрів", () => {
    const result = parseAttribution(
      "?utm_source=a",
      "https://www.example.com/some/path?token=secret#x",
      "/",
      NOW,
    );
    expect(result?.referrer).toBe("www.example.com");
  });

  it("обрізає довгі значення до 200 символів", () => {
    const long = "a".repeat(500);
    const result = parseAttribution(`?utm_campaign=${long}&fbclid=${long}`, "", "/" + long, NOW);
    expect(result?.utm_campaign).toHaveLength(200);
    expect(result?.fbclid).toHaveLength(200);
    expect(result?.landing).toHaveLength(200);
  });
});

describe("mergeAttribution", () => {
  const old: Attribution = {
    utm_source: "old",
    utm_campaign: "old-campaign",
    capturedAt: new Date(NOW.getTime() - 5 * DAY).toISOString(),
  };
  const fresh: Attribution = {
    utm_source: "new",
    capturedAt: NOW.toISOString(),
  };

  it("нове значення повністю замінює старе", () => {
    expect(mergeAttribution(old, fresh, NOW)).toBe(fresh);
  });

  it("нове значення береться, коли старого немає", () => {
    expect(mergeAttribution(null, fresh, NOW)).toBe(fresh);
  });

  it("зберігає старе, якщо йому менше 30 днів", () => {
    expect(mergeAttribution(old, null, NOW)).toBe(old);
  });

  it("старе значення, якому 30 днів, вважається простроченим", () => {
    const expired: Attribution = {
      utm_source: "old",
      capturedAt: new Date(NOW.getTime() - 30 * DAY).toISOString(),
    };
    expect(mergeAttribution(expired, null, NOW)).toBeNull();
  });

  it("невалідна дата в existing означає прострочено", () => {
    expect(mergeAttribution({ utm_source: "x", capturedAt: "oops" }, null, NOW)).toBeNull();
  });

  it("реферер Instagram без міток не затирає свіжі платні мітки", () => {
    const paid: Attribution = {
      utm_source: "facebook",
      utm_medium: "cpc",
      utm_campaign: "autumn",
      capturedAt: new Date(NOW.getTime() - 5 * DAY).toISOString(),
    };
    const referrerOnly = parseAttribution("", "https://l.instagram.com/", "/", NOW);
    expect(mergeAttribution(paid, referrerOnly, NOW)).toBe(paid);
  });

  it("реферер без міток замінює прострочені платні мітки", () => {
    const expiredPaid: Attribution = {
      utm_source: "facebook",
      utm_medium: "cpc",
      utm_campaign: "autumn",
      capturedAt: new Date(NOW.getTime() - 30 * DAY).toISOString(),
    };
    const referrerOnly = parseAttribution("", "https://l.instagram.com/", "/", NOW);
    expect(mergeAttribution(expiredPaid, referrerOnly, NOW)).toBe(referrerOnly);
  });

  it("реферер без міток замінює попередню реферерну атрибуцію", () => {
    const oldReferrer = parseAttribution(
      "",
      "https://m.facebook.com/",
      "/",
      new Date(NOW.getTime() - 2 * DAY),
    );
    const referrerOnly = parseAttribution("", "https://l.instagram.com/", "/", NOW);
    expect(mergeAttribution(oldReferrer, referrerOnly, NOW)).toBe(referrerOnly);
  });

  it("нові UTM замінюють реферерну атрибуцію", () => {
    const oldReferrer = parseAttribution(
      "",
      "https://l.instagram.com/",
      "/",
      new Date(NOW.getTime() - 2 * DAY),
    );
    const newUtm = parseAttribution("?utm_source=google&utm_medium=cpc", "", "/", NOW);
    expect(mergeAttribution(oldReferrer, newUtm, NOW)).toBe(newUtm);
  });

  it("без старого і нового повертає null", () => {
    expect(mergeAttribution(null, null, NOW)).toBeNull();
  });
});

describe("readAttribution / writeAttribution", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubStorage(initial?: string) {
    const store = new Map<string, string>();
    if (initial !== undefined) store.set(ATTRIBUTION_STORAGE_KEY, initial);
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    });
    return store;
  }

  it("на сервері (без window) read дає null, write нічого не робить", () => {
    expect(readAttribution()).toBeNull();
    expect(() => writeAttribution({ capturedAt: NOW.toISOString() })).not.toThrow();
  });

  it("записує і читає значення", () => {
    stubStorage();
    const value: Attribution = { utm_source: "ig", capturedAt: NOW.toISOString() };
    writeAttribution(value);
    expect(readAttribution()).toEqual(value);
  });

  it("write(null) видаляє значення", () => {
    const store = stubStorage();
    writeAttribution({ capturedAt: NOW.toISOString() });
    writeAttribution(null);
    expect(store.has(ATTRIBUTION_STORAGE_KEY)).toBe(false);
  });

  it("невалідний JSON або форма дають null", () => {
    stubStorage("{broken");
    expect(readAttribution()).toBeNull();
    stubStorage(JSON.stringify({ utm_source: "x" }));
    expect(readAttribution()).toBeNull();
    stubStorage(JSON.stringify({ capturedAt: 123 }));
    expect(readAttribution()).toBeNull();
    stubStorage(JSON.stringify([1, 2]));
    expect(readAttribution()).toBeNull();
  });

  it("при читанні лишає тільки відомі ключі і обрізає значення", () => {
    stubStorage(
      JSON.stringify({
        capturedAt: NOW.toISOString(),
        utm_source: "b".repeat(500),
        utm_medium: 42,
        evil: "<script>",
      }),
    );
    const result = readAttribution();
    expect(result?.utm_source).toHaveLength(200);
    expect(result).not.toHaveProperty("utm_medium");
    expect(result).not.toHaveProperty("evil");
  });
});
