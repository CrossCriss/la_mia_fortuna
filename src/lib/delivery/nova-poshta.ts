// Серверний клієнт Nova Poshta API (https://devcenter.novaposhta.ua/) — лише
// автокомпліт міста/відділення для чекауту. Генерація ТТН і розрахунок
// вартості доставки — поза межами MVP (SETUP-CHECKLIST.md п.6.2), тут тільки
// пошук, бо без нього Ref відділення неможливо отримати коректно.
const NOVA_POSHTA_API_URL = "https://api.novaposhta.ua/v2.0/json/";

export type NovaPoshtaCity = {
  ref: string;
  name: string;
  area: string;
};

export type NovaPoshtaWarehouse = {
  ref: string;
  description: string;
  shortAddress: string;
  number: string;
};

type NovaPoshtaResponse<T> = {
  success: boolean;
  data: T[];
  errors: string[];
  warnings: string[];
};

function getApiKey() {
  const apiKey = process.env.NOVA_POSHTA_API_KEY;
  if (!apiKey) {
    throw new Error(
      "NOVA_POSHTA_API_KEY не задано — отримайте ключ у особистому кабінеті Nova Poshta (my.novaposhta.ua → Налаштування → API) і додайте в .env"
    );
  }
  return apiKey;
}

async function callNovaPoshta<T>(
  modelName: string,
  calledMethod: string,
  methodProperties: Record<string, unknown>
): Promise<NovaPoshtaResponse<T>> {
  const response = await fetch(NOVA_POSHTA_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey: getApiKey(),
      modelName,
      calledMethod,
      methodProperties,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Nova Poshta API HTTP ${response.status}`);
  }

  return response.json();
}

// searchSettlements повертає й міста, й села/смт одним пошуком — саме його
// рекомендує документація НП для поля "Місто" на чекауті (а не getCities).
export async function searchNovaPoshtaCities(query: string): Promise<NovaPoshtaCity[]> {
  if (query.trim().length < 2) return [];

  const result = await callNovaPoshta<{
    Addresses: Array<{ Ref: string; Present: string; MainDescription: string; Area: string }>;
  }>("AddressGeneral", "searchSettlements", { CityName: query, Limit: "15" });

  if (!result.success || result.data.length === 0) return [];

  return result.data[0].Addresses.map((address) => ({
    ref: address.Ref,
    name: address.Present,
    area: address.Area,
  }));
}

export async function getNovaPoshtaWarehouses(
  cityRef: string,
  query?: string
): Promise<NovaPoshtaWarehouse[]> {
  if (!cityRef) return [];

  const result = await callNovaPoshta<{
    Ref: string;
    Description: string;
    ShortAddress: string;
    Number: string;
  }>("AddressGeneral", "getWarehouses", {
    CityRef: cityRef,
    FindByString: query || undefined,
    Limit: "50",
  });

  if (!result.success) return [];

  return result.data.map((warehouse) => ({
    ref: warehouse.Ref,
    description: warehouse.Description,
    shortAddress: warehouse.ShortAddress,
    number: warehouse.Number,
  }));
}
