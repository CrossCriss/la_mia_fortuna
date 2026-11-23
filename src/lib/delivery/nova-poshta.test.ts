import { afterEach, describe, expect, it, vi } from "vitest";
import { decideAddressCheck, searchNovaPoshtaCities, verifyNovaPoshtaAddress } from "./nova-poshta";

describe("searchNovaPoshtaCities", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("повертає DeliveryCity як ref і відкидає адреси без відділень", async () => {
    vi.stubEnv("NOVA_POSHTA_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        errors: [],
        warnings: [],
        data: [
          {
            Addresses: [
              {
                Ref: "settlement-1",
                DeliveryCity: "city-1",
                Present: "м. Харків, Харківська обл.",
                MainDescription: "Харків",
                Area: "Харківська",
                Warehouses: 3292,
              },
              {
                Ref: "settlement-2",
                DeliveryCity: "city-2",
                Present: "с. Глухе",
                MainDescription: "Глухе",
                Area: "Харківська",
                Warehouses: 0,
              },
            ],
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const cities = await searchNovaPoshtaCities("Харк");

    expect(cities).toEqual([
      { ref: "city-1", name: "м. Харків, Харківська обл.", area: "Харківська" },
    ]);
  });

  it("прибирає дублі за DeliveryCity, лишаючи перший адрес", async () => {
    vi.stubEnv("NOVA_POSHTA_API_KEY", "test-key");
    const addr = (Ref: string, Present: string) => ({
      Ref,
      DeliveryCity: "same-city",
      Present,
      MainDescription: Present,
      Area: "Обл",
      Warehouses: 5,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          errors: [],
          warnings: [],
          data: [{ Addresses: [addr("a", "Перше"), addr("b", "Друге")] }],
        }),
      })
    );

    const cities = await searchNovaPoshtaCities("Пер");

    expect(cities).toEqual([{ ref: "same-city", name: "Перше", area: "Обл" }]);
  });
});

describe("decideAddressCheck", () => {
  const city = "city-1";
  const wh = "wh-1";

  it("valid: Ref і CityRef збігаються", () => {
    expect(decideAddressCheck({ success: true, data: [{ Ref: wh, CityRef: city }] }, city, wh)).toBe("valid");
  });
  it("invalid: відділення іншого міста", () => {
    expect(decideAddressCheck({ success: true, data: [{ Ref: wh, CityRef: "other" }] }, city, wh)).toBe("invalid");
  });
  it("invalid: порожній data", () => {
    expect(decideAddressCheck({ success: true, data: [] }, city, wh)).toBe("invalid");
  });
  it("unavailable: записи без потрібного Ref", () => {
    expect(decideAddressCheck({ success: true, data: [{ Ref: "x", CityRef: city }] }, city, wh)).toBe("unavailable");
  });
  it("unavailable: success false", () => {
    expect(decideAddressCheck({ success: false, data: [] }, city, wh)).toBe("unavailable");
  });
});

describe("verifyNovaPoshtaAddress", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  function stubFetch(body: unknown, ok = true, status = 200) {
    const fetchMock = vi.fn().mockResolvedValue({ ok, status, json: async () => body });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("valid і передає Ref, CityRef та signal у запит", async () => {
    vi.stubEnv("NOVA_POSHTA_API_KEY", "test-key");
    const fetchMock = stubFetch({ success: true, data: [{ Ref: "wh-1", CityRef: "city-1" }], errors: [], warnings: [] });
    await expect(verifyNovaPoshtaAddress("city-1", "wh-1")).resolves.toBe("valid");
    const init = fetchMock.mock.calls[0][1];
    expect(JSON.parse(init.body).methodProperties).toMatchObject({ Ref: "wh-1", CityRef: "city-1" });
    expect(init.signal).toBeDefined();
  });

  it("invalid: відділення іншого міста", async () => {
    vi.stubEnv("NOVA_POSHTA_API_KEY", "test-key");
    stubFetch({ success: true, data: [{ Ref: "wh-1", CityRef: "other" }] });
    await expect(verifyNovaPoshtaAddress("city-1", "wh-1")).resolves.toBe("invalid");
  });

  it("invalid: порожня відповідь", async () => {
    vi.stubEnv("NOVA_POSHTA_API_KEY", "test-key");
    stubFetch({ success: true, data: [] });
    await expect(verifyNovaPoshtaAddress("city-1", "wh-1")).resolves.toBe("invalid");
  });

  it("unavailable: записи без потрібного Ref", async () => {
    vi.stubEnv("NOVA_POSHTA_API_KEY", "test-key");
    stubFetch({ success: true, data: [{ Ref: "zzz", CityRef: "city-1" }] });
    await expect(verifyNovaPoshtaAddress("city-1", "wh-1")).resolves.toBe("unavailable");
  });

  it("unavailable: success false", async () => {
    vi.stubEnv("NOVA_POSHTA_API_KEY", "test-key");
    stubFetch({ success: false, data: [], errors: ["x"] });
    await expect(verifyNovaPoshtaAddress("city-1", "wh-1")).resolves.toBe("unavailable");
  });

  it("unavailable: HTTP 500", async () => {
    vi.stubEnv("NOVA_POSHTA_API_KEY", "test-key");
    vi.spyOn(console, "error").mockImplementation(() => {});
    stubFetch({}, false, 500);
    await expect(verifyNovaPoshtaAddress("city-1", "wh-1")).resolves.toBe("unavailable");
  });

  it("unavailable: fetch кидає (таймаут)", async () => {
    vi.stubEnv("NOVA_POSHTA_API_KEY", "test-key");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("timeout", "TimeoutError")));
    await expect(verifyNovaPoshtaAddress("city-1", "wh-1", { timeoutMs: 10 })).resolves.toBe("unavailable");
  });

  it("unavailable: немає ключа, fetch не викликається", async () => {
    vi.stubEnv("NOVA_POSHTA_API_KEY", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(verifyNovaPoshtaAddress("city-1", "wh-1")).resolves.toBe("unavailable");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
