import { generateKeyPairSync, sign, type KeyObject } from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetMonobankKeyCacheForTests, parseMonobankWebhook } from "./monobank";

function makeKeyPair() {
  return generateKeyPairSync("ec", { namedCurve: "prime256v1" });
}

function publicKeyBase64(publicKey: KeyObject) {
  return (publicKey.export({ type: "spki", format: "der" }) as Buffer).toString("base64");
}

function signBody(body: Buffer, privateKey: KeyObject) {
  return sign("SHA256", body, privateKey).toString("base64");
}

function makeBody(payload: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(payload), "utf-8");
}

function mockPubkeyFetch(keys: string[]) {
  // Кожен виклик fetch повертає наступний ключ зі списку (останній повторюється).
  let call = 0;
  const fetchMock = vi.fn(async () => {
    const key = keys[Math.min(call, keys.length - 1)];
    call += 1;
    return { ok: true, status: 200, json: async () => ({ key }) };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("parseMonobankWebhook", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.MONOBANK_TOKEN = "test_monobank_token_not_real";
    __resetMonobankKeyCacheForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it("приймає вебхук з вірним підписом і розбирає поля", async () => {
    const { publicKey, privateKey } = makeKeyPair();
    const fetchMock = mockPubkeyFetch([publicKeyBase64(publicKey)]);
    const body = makeBody({ invoiceId: "inv-1", status: "success", reference: "LMF-1", amount: 15050 });

    const result = await parseMonobankWebhook(body, signBody(body, privateKey));

    expect(result.orderNumber).toBe("LMF-1");
    expect(result.invoiceId).toBe("inv-1");
    expect(result.status).toBe("PAID");
    expect(result.amount).toBe(150.5);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("відхиляє змінене тіло", async () => {
    const { publicKey, privateKey } = makeKeyPair();
    mockPubkeyFetch([publicKeyBase64(publicKey)]);
    const body = makeBody({ invoiceId: "inv-1", status: "failure", reference: "LMF-1", amount: 100 });
    const signature = signBody(body, privateKey);
    const tampered = makeBody({ invoiceId: "inv-1", status: "success", reference: "LMF-1", amount: 100 });

    await expect(parseMonobankWebhook(tampered, signature)).rejects.toThrow("Невірний підпис");
  });

  it("відхиляє підпис, зроблений чужим ключем", async () => {
    const real = makeKeyPair();
    const attacker = makeKeyPair();
    mockPubkeyFetch([publicKeyBase64(real.publicKey)]);
    const body = makeBody({ invoiceId: "inv-1", status: "success", reference: "LMF-1", amount: 100 });

    await expect(parseMonobankWebhook(body, signBody(body, attacker.privateKey))).rejects.toThrow(
      "Невірний підпис"
    );
  });

  it("відхиляє порожній підпис", async () => {
    const { publicKey } = makeKeyPair();
    mockPubkeyFetch([publicKeyBase64(publicKey)]);
    const body = makeBody({ invoiceId: "inv-1", status: "success", reference: "LMF-1" });

    await expect(parseMonobankWebhook(body, "")).rejects.toThrow("Невірний підпис");
  });

  it("кешує ключ між вебхуками і не ходить у мережу вдруге", async () => {
    const { publicKey, privateKey } = makeKeyPair();
    const fetchMock = mockPubkeyFetch([publicKeyBase64(publicKey)]);
    const body1 = makeBody({ invoiceId: "inv-1", status: "success", reference: "LMF-1" });
    const body2 = makeBody({ invoiceId: "inv-2", status: "success", reference: "LMF-2" });

    await parseMonobankWebhook(body1, signBody(body1, privateKey));
    await parseMonobankWebhook(body2, signBody(body2, privateKey));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("при зміні ключа перезапитує ключ і приймає вебхук з новим підписом", async () => {
    const oldPair = makeKeyPair();
    const newPair = makeKeyPair();
    const fetchMock = mockPubkeyFetch([publicKeyBase64(oldPair.publicKey), publicKeyBase64(newPair.publicKey)]);

    const body1 = makeBody({ invoiceId: "inv-1", status: "success", reference: "LMF-1" });
    await parseMonobankWebhook(body1, signBody(body1, oldPair.privateKey));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Monobank ротував ключ: підпис новим ключем, у кеші ще старий.
    const body2 = makeBody({ invoiceId: "inv-2", status: "success", reference: "LMF-2" });
    const result = await parseMonobankWebhook(body2, signBody(body2, newPair.privateKey));

    expect(result.invoiceId).toBe("inv-2");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("невірний підпис викликає один повторний запит ключа і відмову", async () => {
    const { publicKey } = makeKeyPair();
    const attacker = makeKeyPair();
    const fetchMock = mockPubkeyFetch([publicKeyBase64(publicKey)]);
    const body = makeBody({ invoiceId: "inv-1", status: "success", reference: "LMF-1" });

    await expect(parseMonobankWebhook(body, signBody(body, attacker.privateKey))).rejects.toThrow(
      "Невірний підпис"
    );
    // перший запит (порожній кеш) + примусове оновлення
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("кидає помилку, якщо запит ключа повернув не-2xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }))
    );
    const { privateKey } = makeKeyPair();
    const body = makeBody({ invoiceId: "inv-1", status: "success", reference: "LMF-1" });

    await expect(parseMonobankWebhook(body, signBody(body, privateKey))).rejects.toThrow("pubkey HTTP 500");
  });

  describe("мапінг статусів і суми", () => {
    async function parse(payload: Record<string, unknown>) {
      const { publicKey, privateKey } = makeKeyPair();
      mockPubkeyFetch([publicKeyBase64(publicKey)]);
      __resetMonobankKeyCacheForTests();
      const body = makeBody(payload);
      return parseMonobankWebhook(body, signBody(body, privateKey));
    }

    it("success -> PAID", async () => {
      expect((await parse({ invoiceId: "i", status: "success" })).status).toBe("PAID");
    });

    it("failure і expired -> FAILED", async () => {
      expect((await parse({ invoiceId: "i", status: "failure" })).status).toBe("FAILED");
      expect((await parse({ invoiceId: "i", status: "expired" })).status).toBe("FAILED");
    });

    it("reversed -> REFUNDED", async () => {
      expect((await parse({ invoiceId: "i", status: "reversed" })).status).toBe("REFUNDED");
    });

    it("created, processing, hold та невідомі -> PENDING", async () => {
      expect((await parse({ invoiceId: "i", status: "created" })).status).toBe("PENDING");
      expect((await parse({ invoiceId: "i", status: "processing" })).status).toBe("PENDING");
      expect((await parse({ invoiceId: "i", status: "hold" })).status).toBe("PENDING");
      expect((await parse({ invoiceId: "i", status: "brand_new" })).status).toBe("PENDING");
    });

    it("сума з копійок переводиться в гривні", async () => {
      expect((await parse({ invoiceId: "i", status: "success", amount: 12345 })).amount).toBe(123.45);
    });

    it("відсутня або нечислова сума -> null", async () => {
      expect((await parse({ invoiceId: "i", status: "success" })).amount).toBeNull();
      expect((await parse({ invoiceId: "i", status: "success", amount: "100" })).amount).toBeNull();
    });

    it("відсутній reference -> порожній orderNumber", async () => {
      expect((await parse({ invoiceId: "i", status: "success" })).orderNumber).toBe("");
    });
  });
});
