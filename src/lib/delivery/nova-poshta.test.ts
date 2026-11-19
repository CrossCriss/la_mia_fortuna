import { afterEach, describe, expect, it, vi } from "vitest";
import { searchNovaPoshtaCities } from "./nova-poshta";

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
