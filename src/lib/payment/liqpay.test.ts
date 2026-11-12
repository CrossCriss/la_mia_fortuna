import { createHash } from "crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseLiqpayCallback } from "./liqpay";

const PRIVATE_KEY = "test_private_key_not_real";
const PUBLIC_KEY = "test_public_key_not_real";

function makeData(payload: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function signData(data: string, privateKey = PRIVATE_KEY) {
  return createHash("sha1").update(privateKey + data + privateKey).digest("base64");
}

describe("parseLiqpayCallback", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.LIQPAY_PUBLIC_KEY = PUBLIC_KEY;
    process.env.LIQPAY_PRIVATE_KEY = PRIVATE_KEY;
    delete process.env.LIQPAY_SANDBOX;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("розбирає callback з вірним підписом", () => {
    const data = makeData({ order_id: "LMF-1", status: "success", amount: 150.5 });
    const result = parseLiqpayCallback(data, signData(data));

    expect(result.orderNumber).toBe("LMF-1");
    expect(result.invoiceId).toBe("LMF-1");
    expect(result.status).toBe("PAID");
    expect(result.amount).toBe(150.5);
  });

  it("кидає помилку при невірному підписі", () => {
    const data = makeData({ order_id: "LMF-1", status: "success", amount: 150 });
    expect(() => parseLiqpayCallback(data, signData(data, "other_key"))).toThrow();
  });

  it("кидає помилку, якщо data підмінили після підпису", () => {
    const data = makeData({ order_id: "LMF-1", status: "failure", amount: 150 });
    const signature = signData(data);
    const tampered = makeData({ order_id: "LMF-1", status: "success", amount: 150 });
    expect(() => parseLiqpayCallback(tampered, signature)).toThrow();
  });

  it("відмовляє без винятку timingSafeEqual при підписі іншої довжини", () => {
    const data = makeData({ order_id: "LMF-1", status: "success" });
    expect(() => parseLiqpayCallback(data, "short")).toThrow("Невірний підпис");
    expect(() => parseLiqpayCallback(data, "")).toThrow("Невірний підпис");
    expect(() => parseLiqpayCallback(data, signData(data) + "extra")).toThrow("Невірний підпис");
  });

  it("кидає помилку, якщо ключі не задані", () => {
    delete process.env.LIQPAY_PRIVATE_KEY;
    const data = makeData({ order_id: "LMF-1", status: "success" });
    expect(() => parseLiqpayCallback(data, signData(data))).toThrow();
  });

  describe("мапінг статусів", () => {
    function statusOf(status: string) {
      const data = makeData({ order_id: "LMF-1", status });
      return parseLiqpayCallback(data, signData(data)).status;
    }

    it("success -> PAID", () => {
      expect(statusOf("success")).toBe("PAID");
    });

    it("failure і error -> FAILED", () => {
      expect(statusOf("failure")).toBe("FAILED");
      expect(statusOf("error")).toBe("FAILED");
    });

    it("reversed -> REFUNDED", () => {
      expect(statusOf("reversed")).toBe("REFUNDED");
    });

    it("невідомі та проміжні статуси -> PENDING", () => {
      expect(statusOf("processing")).toBe("PENDING");
      expect(statusOf("wait_accept")).toBe("PENDING");
      expect(statusOf("something_new")).toBe("PENDING");
    });

    it("sandbox без LIQPAY_SANDBOX -> PENDING", () => {
      expect(statusOf("sandbox")).toBe("PENDING");
    });

    it("sandbox з LIQPAY_SANDBOX=0 -> PENDING", () => {
      process.env.LIQPAY_SANDBOX = "0";
      expect(statusOf("sandbox")).toBe("PENDING");
    });

    it("sandbox з LIQPAY_SANDBOX=1 -> PAID", () => {
      process.env.LIQPAY_SANDBOX = "1";
      expect(statusOf("sandbox")).toBe("PAID");
    });
  });

  describe("сума", () => {
    function amountOf(amount: unknown) {
      const data = makeData({ order_id: "LMF-1", status: "success", amount });
      return parseLiqpayCallback(data, signData(data)).amount;
    }

    it("число і числовий рядок розбираються в число", () => {
      expect(amountOf(99)).toBe(99);
      expect(amountOf("99.90")).toBe(99.9);
    });

    it("відсутня, порожня або нечислова сума -> null", () => {
      expect(amountOf(undefined)).toBeNull();
      expect(amountOf("")).toBeNull();
      expect(amountOf("abc")).toBeNull();
    });
  });
});
