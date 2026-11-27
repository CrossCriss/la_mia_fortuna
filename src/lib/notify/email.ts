import { formatPrice } from "@/lib/format-price";
import { getSiteUrl, SITE } from "@/lib/site-config";

// Лист покупниці про прийняте замовлення (Resend через fetch, без залежностей).
// Збій листа ніколи не ламає оформлення замовлення.

type MoneyLike = number | string | { toString(): string };

export interface OrderEmailItem {
  productName: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
  price: MoneyLike;
  total: MoneyLike;
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  email?: string | null;
  paymentMethod: string;
  shippingCity?: string | null;
  shippingWarehouse?: string | null;
  total: MoneyLike;
  items: OrderEmailItem[];
}

function money(value: MoneyLike): string {
  const amount = Number(typeof value === "object" ? value.toString() : value);
  return formatPrice(Number.isFinite(amount) ? amount : 0);
}

function clean(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatOrderEmail(order: OrderEmailData): { subject: string; html: string; text: string } {
  const subject = `Замовлення ${order.orderNumber} прийнято | ${SITE.name}`;
  const name = clean(order.customerName);
  const greeting = name ? `Вітаємо, ${name}!` : "Вітаємо!";
  const thanks = "Дякуємо за замовлення! Ми зв'яжемося з вами, щоб підтвердити його.";
  const payment =
    order.paymentMethod === "CASH_ON_DELIVERY"
      ? "Накладений платіж (оплата при отриманні у відділенні Нової Пошти)"
      : "Оплата карткою онлайн";
  const place = [clean(order.shippingCity), clean(order.shippingWarehouse)].filter(Boolean).join(", ");
  const delivery = place ? `Нова Пошта: ${place}` : "Нова Пошта";
  const deliveryCost = "Вартість доставки за тарифами Нової Пошти";
  const siteUrl = getSiteUrl();
  const contacts: [string, string][] = [
    ["Телефон", SITE.phoneDisplay],
    ["Telegram", SITE.telegramUrl],
    ["Viber", SITE.viberUrl],
    ["Instagram", SITE.instagramUrl],
    ["Сайт", siteUrl],
  ];

  const rows = order.items.map((item) => ({
    name: item.productName,
    size: clean(item.size),
    color: clean(item.color),
    qty: item.quantity,
    price: money(item.price),
    total: money(item.total),
  }));

  const text = [
    greeting,
    "",
    thanks,
    "",
    `Номер замовлення: ${order.orderNumber}`,
    "",
    "Товари:",
    ...rows.map((r, i) => {
      const details = [r.size && `розмір ${r.size}`, r.color && `колір ${r.color}`].filter(Boolean).join(", ");
      return `${i + 1}. ${r.name}${details ? ` (${details})` : ""} - ${r.qty} шт. x ${r.price} = ${r.total}`;
    }),
    "",
    `Разом: ${money(order.total)}`,
    `Оплата: ${payment}`,
    `Доставка: ${delivery}`,
    deliveryCost,
    "",
    "Контакти:",
    ...contacts.map(([label, value]) => `${label}: ${value}`),
    "",
    SITE.name,
  ].join("\n");

  const td = 'style="padding:6px 8px;border-bottom:1px solid #e5e5e5;text-align:left;"';
  const tdr = 'style="padding:6px 8px;border-bottom:1px solid #e5e5e5;text-align:right;"';
  const itemRows = rows
    .map(
      (r) =>
        `<tr><td ${td}>${esc(r.name)}</td><td ${td}>${esc(r.size) || "-"}</td><td ${td}>${esc(r.color) || "-"}</td>` +
        `<td ${tdr}>${r.qty}</td><td ${tdr}>${esc(r.price)}</td><td ${tdr}>${esc(r.total)}</td></tr>`,
    )
    .join("");
  const th = 'style="padding:6px 8px;border-bottom:2px solid #333;text-align:left;"';
  const contactHtml = contacts
    .map(([label, value]) => `<div>${esc(label)}: ${esc(value)}</div>`)
    .join("");

  const html =
    `<!DOCTYPE html><html lang="uk"><body style="margin:0;padding:16px;background:#ffffff;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222222;">` +
    `<tr><td>` +
    `<p style="font-size:16px;">${esc(greeting)}</p>` +
    `<p>${esc(thanks)}</p>` +
    `<p>Номер замовлення: <strong>${esc(order.orderNumber)}</strong></p>` +
    `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">` +
    `<tr><th ${th}>Товар</th><th ${th}>Розмір</th><th ${th}>Колір</th><th ${th}>К-сть</th><th ${th}>Ціна</th><th ${th}>Сума</th></tr>` +
    itemRows +
    `</table>` +
    `<p style="font-size:16px;"><strong>Разом: ${esc(money(order.total))}</strong></p>` +
    `<p>Оплата: ${esc(payment)}</p>` +
    `<p>Доставка: ${esc(delivery)}<br>${esc(deliveryCost)}</p>` +
    `<p style="margin-top:24px;">${contactHtml}</p>` +
    `<p>${esc(SITE.name)}</p>` +
    `</td></tr></table></body></html>`;

  return { subject, html, text };
}

let missingConfigWarned = false;

// Ніколи не кидає виняток. Ключ і адреса покупниці в логи не потрапляють.
export async function sendOrderEmail(order: OrderEmailData): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (!missingConfigWarned) {
      missingConfigWarned = true;
      console.warn("Email-листи вимкнені: не задано RESEND_API_KEY або EMAIL_FROM");
    }
    return;
  }

  const to = clean(order.email);
  if (!to) return;

  try {
    const { subject, html, text } = formatOrderEmail(order);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `order-${order.orderNumber}`,
      },
      body: JSON.stringify({ from, to: [to], reply_to: SITE.seller.email, subject, html, text }),
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      console.error(`Email: не вдалося надіслати лист, статус ${response.status}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "невідома помилка";
    const safe = message.split(apiKey).join("***").split(to).join("***");
    console.error(`Email: помилка надсилання листа: ${safe}`);
  }
}

// Лише для тестів: скидає прапорець одноразового попередження.
export function resetEmailWarningForTests(): void {
  missingConfigWarned = false;
}
