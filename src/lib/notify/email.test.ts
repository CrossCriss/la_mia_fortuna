import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatOrderEmail, resetEmailWarningForTests, sendOrderEmail, type OrderEmailData } from "./email";

const KEY = "re_secret_key_123";
const ADDRESS = "buyer@example.com";

function makeOrder(overrides: Partial<OrderEmailData> = {}): OrderEmailData {
  return {
    orderNumber: "GP-000123",
    customerName: "Олена",
    email: ADDRESS,
    paymentMethod: "CASH_ON_DELIVERY",
    shippingCity: "Харків",
    shippingWarehouse: "Відділення 5",
    total: 3000,
    items: [
      { productName: "Туфлі Mia", size: "38", color: "Чорний", quantity: 2, price: 1500, total: 3000 },
    ],
    ...overrides,
  };
}

describe("formatOrderEmail", () => {
  it("містить тему з номером", () => {
    const { subject } = formatOrderEmail(makeOrder());
    expect(subject).toBe("Замовлення GP-000123 прийнято | La Mia Fortuna Shoes");
  });

  it("екранує HTML у імені і назві товару", () => {
    const { html, text } = formatOrderEmail(
      makeOrder({
        customerName: "<script>alert(1)</script>",
        items: [{ productName: "<script>x</script>", quantity: 1, price: 1, total: 1 }],
      }),
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(text).toContain("<script>");
  });

  it("підпис оплати для накладеного платежу і картки", () => {
    const cod = formatOrderEmail(makeOrder());
    expect(cod.text).toContain("Накладений платіж (оплата при отриманні у відділенні Нової Пошти)");
    const card = formatOrderEmail(makeOrder({ paymentMethod: "ONLINE_CARD" }));
    expect(card.text).toContain("Оплата карткою онлайн");
    expect(card.html).toContain("Оплата карткою онлайн");
  });

  it("рядки товарів з розміром і кольором та без них", () => {
    const withAttrs = formatOrderEmail(makeOrder());
    expect(withAttrs.text).toContain("Туфлі Mia (розмір 38, колір Чорний) - 2 шт.");
    expect(withAttrs.html).toContain("<td");
    const without = formatOrderEmail(
      makeOrder({ items: [{ productName: "Сумка", quantity: 1, price: 500, total: 500 }] }),
    );
    expect(without.text).toContain("1. Сумка - 1 шт.");
    expect(without.text).not.toContain("розмір");
  });

  it("містить доставку, підсумок і контакти", () => {
    const { text } = formatOrderEmail(makeOrder());
    expect(text).toContain("Нова Пошта: Харків, Відділення 5");
    expect(text).toContain("Вартість доставки за тарифами Нової Пошти");
    expect(text).toContain("Разом: 3 000 ₴");
    expect(text).toContain("066 790 10 44");
  });

  it("містить текстовий логотип у html", () => {
    const { html } = formatOrderEmail(makeOrder());
    expect(html).toContain("FORTUNA");
    expect(html).toContain("LA MIA");
  });

  it("Viber виводиться номером без viber:// посилання", () => {
    const { html, text } = formatOrderEmail(makeOrder());
    expect(html).not.toContain("viber://");
    expect(text).not.toContain("viber://");
    expect(html).toContain("Viber: 066 790 10 44");
    expect(text).toContain("Viber: 066 790 10 44");
  });
});

describe("sendOrderEmail", () => {
  const fetchMock = vi.fn();
  let warn: ReturnType<typeof vi.spyOn>;
  let error: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("RESEND_API_KEY", KEY);
    vi.stubEnv("EMAIL_FROM", "La Mia Fortuna <orders@example.com>");
    resetEmailWarningForTests();
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    error = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("без змінних не викликає fetch, попередження одне", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    await sendOrderEmail(makeOrder());
    await sendOrderEmail(makeOrder());
    expect(fetchMock).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("без email не викликає fetch", async () => {
    await sendOrderEmail(makeOrder({ email: "" }));
    await sendOrderEmail(makeOrder({ email: null }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it("надсилає запит з правильним тілом і заголовками", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    await sendOrderEmail(makeOrder());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe(`Bearer ${KEY}`);
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers["Idempotency-Key"]).toBe("order-GP-000123");
    expect(init.signal).toBeDefined();
    const body = JSON.parse(init.body);
    expect(body.from).toBe("La Mia Fortuna <orders@example.com>");
    expect(body.to).toEqual([ADDRESS]);
    expect(body.reply_to).toBe("lerafortuna1992@gmail.com");
    expect(body.subject).toContain("GP-000123");
    expect(typeof body.html).toBe("string");
    expect(typeof body.text).toBe("string");
  });

  it("відхилений fetch не кидає і не пише ключ та адресу", async () => {
    fetchMock.mockRejectedValue(new Error(`boom ${KEY} ${ADDRESS}`));
    await expect(sendOrderEmail(makeOrder())).resolves.toBeUndefined();
    const logged = JSON.stringify(error.mock.calls);
    expect(error).toHaveBeenCalled();
    expect(logged).not.toContain(KEY);
    expect(logged).not.toContain(ADDRESS);
  });

  it("відповідь 500 не кидає і не пише ключ та адресу", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    await expect(sendOrderEmail(makeOrder())).resolves.toBeUndefined();
    const logged = JSON.stringify(error.mock.calls);
    expect(logged).toContain("500");
    expect(logged).not.toContain(KEY);
    expect(logged).not.toContain(ADDRESS);
  });
});
