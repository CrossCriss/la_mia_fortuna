import { describe, expect, it } from "vitest";
import { buildOrdersCsv, type CsvOrder } from "./orders-csv";

function order(over: Partial<CsvOrder> = {}): CsvOrder {
  return {
    orderNumber: "GP-000001",
    createdAt: new Date("2026-11-20T10:05:00Z"),
    status: "NEW",
    paymentMethod: "CASH_ON_DELIVERY",
    paymentStatus: "PENDING",
    customerName: "Олена",
    phone: "+380501234567",
    email: "a@b.ua",
    shippingCity: "Харків",
    shippingWarehouse: "Відділення 1",
    trackingNumber: null,
    comment: null,
    total: "2500",
    attribution: null,
    items: [{ productName: "Туфлі", size: "38", color: "чорний", quantity: 1 }],
    ...over,
  };
}

function rows(csv: string): string[] {
  return csv.slice(1).split("\r\n");
}

describe("buildOrdersCsv", () => {
  it("starts with BOM and header", () => {
    const csv = buildOrdersCsv([]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(rows(csv)[0]).toBe(
      "Номер;Дата;Статус;Оплата;Статус оплати;Клієнт;Телефон;Email;Місто;Відділення;Товари;Кількість пар;Сума, грн;ТТН;Коментар;Джерело",
    );
  });

  it("uses ; separator and CRLF between rows", () => {
    const r = rows(buildOrdersCsv([order(), order({ orderNumber: "GP-000002" })]));
    expect(r).toHaveLength(3);
    expect(r[1].split(";")[0]).toBe("GP-000001");
    expect(r[1]).toContain(";Новий;Накладений платіж;Очікує;Олена;");
  });

  it("quotes cells with quotes and semicolons", () => {
    const r = rows(buildOrdersCsv([order({ comment: 'Скажіть "привіт"; дякую' })]));
    expect(r[1]).toContain('"Скажіть ""привіт""; дякую"');
  });

  it("keeps line breaks inside quoted cell", () => {
    const csv = buildOrdersCsv([order({ comment: "рядок1\nрядок2" })]);
    expect(csv).toContain('"рядок1\nрядок2"');
  });

  it("guards against formula injection", () => {
    const csv = buildOrdersCsv([order({ customerName: '=HYPERLINK("http://x";"y")' })]);
    expect(csv).toContain(`"'=HYPERLINK(""http://x"";""y"")"`);
    expect(buildOrdersCsv([order({ comment: "-1" })])).toContain(";'-1;");
  });

  it("formats amount and Kyiv date", () => {
    const r = rows(buildOrdersCsv([order({ createdAt: new Date("2026-11-20T23:30:00Z") })]));
    const cells = r[1].split(";");
    expect(cells[1]).toBe("21.11.2026 01:30");
    expect(cells[12]).toBe("2500,00");
  });

  it("formats phone nationally or leaves as is", () => {
    expect(rows(buildOrdersCsv([order()]))[1]).toContain(";050 123 45 67;");
    expect(rows(buildOrdersCsv([order({ phone: "12345" })]))[1]).toContain(";12345;");
  });

  it("handles empty email and empty fields", () => {
    const r = rows(
      buildOrdersCsv([
        order({ email: null, shippingCity: null, shippingWarehouse: null, comment: null }),
      ]),
    );
    expect(r[1].split(";")).toHaveLength(16);
    expect(r[1]).toContain(";050 123 45 67;;;;");
  });

  it("joins several items in one cell and sums pairs", () => {
    const r = rows(
      buildOrdersCsv([
        order({
          items: [
            { productName: "Туфлі", size: "38", color: "чорний", quantity: 1 },
            { productName: "Кеди", size: null, color: null, quantity: 2 },
          ],
        }),
      ]),
    );
    expect(r[1]).toContain('"Туфлі (розмір 38, колір чорний) x 1; Кеди x 2";3;');
  });

  it("fills source from attribution", () => {
    const r = rows(buildOrdersCsv([order({ attribution: { utm_source: "instagram", utm_medium: "paid" } })]));
    expect(r[1].endsWith(";instagram / paid")).toBe(true);
  });
});
