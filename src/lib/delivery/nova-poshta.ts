// Серверний клієнт Nova Poshta API (https://devcenter.novaposhta.ua/) - лише
// автокомпліт міста/відділення для чекауту. Генерація ТТН і розрахунок
// вартості доставки - поза межами MVP (SETUP-CHECKLIST.md п.6.2), тут тільки
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
      "NOVA_POSHTA_API_KEY не задано - отримайте ключ у особистому кабінеті Nova Poshta (my.novaposhta.ua -> Налаштування -> Безпека -> Мої ключі API) і додайте в .env"
    );
  }
  return apiKey;
}

async function callNovaPoshta<T>(
  modelName: string,
  calledMethod: string,
  methodProperties: Record<string, unknown>,
  signal?: AbortSignal
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
    signal,
  });

  if (!response.ok) {
    throw new Error(`Nova Poshta API HTTP ${response.status}`);
  }

  return response.json();
}

// searchSettlements повертає й міста, й села/смт одним пошуком - саме його
// рекомендує документація НП для поля "Місто" на чекауті (а не getCities).
export async function searchNovaPoshtaCities(query: string): Promise<NovaPoshtaCity[]> {
  if (query.trim().length < 2) return [];

  const result = await callNovaPoshta<{
    Addresses: Array<{
      Ref: string;
      DeliveryCity: string;
      Present: string;
      MainDescription: string;
      Area: string;
      Warehouses: number;
    }>;
  }>("AddressGeneral", "searchSettlements", { CityName: query, Limit: "15" });

  if (!result.success || result.data.length === 0) return [];

  // getWarehouses очікує CityRef = DeliveryCity (а не Ref населеного пункту,
  // який повертає searchSettlements), інакше НП відповідає "City not found".
  // Адреси без відділень (Warehouses = 0) для вибору відділення марні.
  const seen = new Set<string>();
  const cities: NovaPoshtaCity[] = [];
  for (const address of result.data[0].Addresses) {
    if (!address.DeliveryCity || address.Warehouses <= 0) continue;
    // Кілька населених пунктів можуть мати один DeliveryCity: лишаємо перший.
    if (seen.has(address.DeliveryCity)) continue;
    seen.add(address.DeliveryCity);
    cities.push({ ref: address.DeliveryCity, name: address.Present, area: address.Area });
  }
  return cities;
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

export type AddressCheck = "valid" | "invalid" | "unavailable";

type WarehouseRefRecord = { Ref?: string; CityRef?: string };

// Чиста функція рішення: відповідь НП на getWarehouses з фільтром по Ref і
// CityRef -> чи існує відділення в обраному місті. Якщо НП не змогла
// відповісти або фільтр не спрацював - "unavailable", чесного покупця не блокуємо.
export function decideAddressCheck(
  response: { success: boolean; data?: WarehouseRefRecord[] } | null | undefined,
  cityRef: string,
  warehouseRef: string
): AddressCheck {
  if (!response || !response.success || !Array.isArray(response.data)) return "unavailable";
  if (response.data.length === 0) return "invalid";

  const match = response.data.find((record) => record.Ref === warehouseRef);
  if (!match) return "unavailable";
  return match.CityRef === cityRef ? "valid" : "invalid";
}

// Серверна перевірка, що відділення існує і належить місту. Ніколи не кидає
// виняток: будь-яка помилка зв'язку = "unavailable".
export async function verifyNovaPoshtaAddress(
  cityRef: string,
  warehouseRef: string,
  options?: { timeoutMs?: number }
): Promise<AddressCheck> {
  try {
    if (!process.env.NOVA_POSHTA_API_KEY || !cityRef || !warehouseRef) {
      if (!process.env.NOVA_POSHTA_API_KEY) {
        console.error("Nova Poshta: NOVA_POSHTA_API_KEY не задано, адресу не перевірено");
      }
      return "unavailable";
    }

    const response = await callNovaPoshta<WarehouseRefRecord>(
      "AddressGeneral",
      "getWarehouses",
      { Ref: warehouseRef, CityRef: cityRef, Limit: "50" },
      AbortSignal.timeout(options?.timeoutMs ?? 3000)
    );
    return decideAddressCheck(response, cityRef, warehouseRef);
  } catch (error) {
    console.error(
      "Nova Poshta: не вдалося перевірити адресу:",
      error instanceof Error ? error.message : "unknown error"
    );
    return "unavailable";
  }
}
