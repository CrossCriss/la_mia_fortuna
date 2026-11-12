import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatNewOrderMessage,
  formatPaidMessage,
  resetTelegramWarningForTests,
  sendTelegramMessage,
  type NotifyOrder,
} from "./telegram";

const FAKE_TOKEN = "123456:fake-token";
// Довгі тире (en/em) збираємо з кодів, щоб не вживати їх у вихідному коді.
const LONG_DASH = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);
const FAKE_CHAT = "-1001234567890";

const baseOrder: NotifyOrder = {
  orderNumber: "LMF-TEST-0001",
  customerName: "Олена Коваль",
  phone: "+380501112233",
  email: "olena@example.com",
  shippingCity: "Київ",
  shippingWarehouse: "Відділення №5",
  paymentMethod: "CASH_ON_DELIVERY",
  comment: "Передзвоніть до відправки",
  total: "3300.00",
  items: [
    { productName: "Туфлі Classic", size: "38", color: "Чорний", quantity: 2, price: "1500.00" },
    { productName: "Балетки Soft", size: null, color: null, quantity: 1, price: 300 },
  ],
};

describe("formatNewOrderMessage", () => {
  const url = "https://example.com/admin/orders/abc";

  it("містить усі поля замовлення", () => {
    const text = formatNewOrderMessage(baseOrder, url);
    for (const part of [
      "LMF-TEST-0001",
      "Олена Коваль",
      "+380501112233",
      "olena@example.com",
      "Київ",
      "Відділення №5",
      "Туфлі Classic",
      "розмір 38",
      "колір Чорний",
      "2 шт.",
      "1 500 ₴",
      "Балетки Soft",
      "1 шт.",
      "3 300 ₴",
      "Накладений платіж",
      "Передзвоніть до відправки",
      url,
    ]) {
      expect(text).toContain(part);
    }
  });

  it("для картки онлайн вказує очікування оплати", () => {
    const text = formatNewOrderMessage({ ...baseOrder, paymentMethod: "MONOBANK" }, url);
    expect(text).toContain("Карткою онлайн, очікує оплату");
    expect(text).not.toContain("Накладений платіж");
  });

  it("без коментаря й email не містить undefined/null і відповідних рядків", () => {
    const text = formatNewOrderMessage(
      { ...baseOrder, comment: null, email: undefined, shippingCity: null, shippingWarehouse: undefined },
      url
    );
    expect(text).not.toMatch(/undefined|null/);
    expect(text).not.toContain("Коментар");
    expect(text).not.toContain("Email");

    const blank = formatNewOrderMessage({ ...baseOrder, comment: "  ", email: "" }, url);
    expect(blank).not.toContain("Коментар");
    expect(blank).not.toContain("Email");
    expect(blank).not.toMatch(/undefined|null/);
  });

  it("не містить довгих тире", () => {
    expect(formatNewOrderMessage(baseOrder, url)).not.toMatch(LONG_DASH);
  });
});

describe("formatPaidMessage", () => {
  it("містить номер і суму", () => {
    const text = formatPaidMessage("LMF-TEST-0001", "3300.00");
    expect(text).toContain("LMF-TEST-0001");
    expect(text).toContain("3 300 ₴");
    expect(text).toContain("оплачено");
    expect(text).not.toMatch(/undefined|null/);
    expect(text).not.toMatch(LONG_DASH);
  });
});

describe("sendTelegramMessage", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    resetTelegramWarningForTests();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("без змінних оточення не викликає fetch, не кидає і попереджає один раз", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    vi.stubEnv("TELEGRAM_CHAT_ID", "");

    await expect(sendTelegramMessage("a")).resolves.toBeUndefined();
    await expect(sendTelegramMessage("b")).resolves.toBeUndefined();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("без chat id теж не викликає fetch", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", FAKE_TOKEN);
    vi.stubEnv("TELEGRAM_CHAT_ID", "");

    await sendTelegramMessage("a");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("надсилає JSON з chat_id, text і disable_web_page_preview", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", FAKE_TOKEN);
    vi.stubEnv("TELEGRAM_CHAT_ID", FAKE_CHAT);
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    await sendTelegramMessage("привіт");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://api.telegram.org/bot${FAKE_TOKEN}/sendMessage`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ chat_id: FAKE_CHAT, text: "привіт", disable_web_page_preview: true });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("не кидає при reject fetch і не логує токен", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", FAKE_TOKEN);
    vi.stubEnv("TELEGRAM_CHAT_ID", FAKE_CHAT);
    fetchMock.mockRejectedValue(new Error(`request to https://api.telegram.org/bot${FAKE_TOKEN}/sendMessage failed`));

    await expect(sendTelegramMessage("x")).resolves.toBeUndefined();

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(FAKE_TOKEN);
  });

  it("не кидає при не-2xx відповіді і логує лише статус", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", FAKE_TOKEN);
    vi.stubEnv("TELEGRAM_CHAT_ID", FAKE_CHAT);
    fetchMock.mockResolvedValue({ ok: false, status: 403 });

    await expect(sendTelegramMessage("x")).resolves.toBeUndefined();

    const logged = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logged).toContain("403");
    expect(logged).not.toContain(FAKE_TOKEN);
  });
});
