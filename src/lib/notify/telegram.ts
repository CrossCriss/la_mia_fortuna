import { formatPrice } from "@/lib/format-price";

// Сповіщення власниці магазину в Telegram. Повідомлення йдуть в окрему
// Telegram-групу клієнтки: TELEGRAM_CHAT_ID - це ідентифікатор групи
// (від'ємне число). Для Telegram API це звичайний chat_id.

// Decimal з Prisma (або число/рядок) - приводимо до числа лише для відображення.
type MoneyLike = number | string | { toString(): string };

export interface NotifyOrderItem {
  productName: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
  price: MoneyLike;
}

export interface NotifyOrder {
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string | null;
  shippingCity?: string | null;
  shippingWarehouse?: string | null;
  paymentMethod: string;
  comment?: string | null;
  total: MoneyLike;
  items: NotifyOrderItem[];
}

function money(value: MoneyLike): string {
  const amount = Number(typeof value === "object" ? value.toString() : value);
  return formatPrice(Number.isFinite(amount) ? amount : 0);
}

function clean(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatItem(item: NotifyOrderItem, index: number): string {
  const details = [clean(item.size) && `розмір ${clean(item.size)}`, clean(item.color) && `колір ${clean(item.color)}`]
    .filter(Boolean)
    .join(", ");
  const name = details ? `${item.productName} (${details})` : item.productName;
  return `${index + 1}. ${name} - ${item.quantity} шт. x ${money(item.price)}`;
}

export function formatNewOrderMessage(order: NotifyOrder, adminUrl: string): string {
  const isCod = order.paymentMethod === "CASH_ON_DELIVERY";
  const payment = isCod ? "Накладений платіж" : "Карткою онлайн, очікує оплату";

  const city = clean(order.shippingCity);
  const warehouse = clean(order.shippingWarehouse);
  const delivery = [city, warehouse].filter(Boolean).join(", ");

  const lines: string[] = [
    `Нове замовлення ${order.orderNumber}`,
    "",
    `Клієнт: ${order.customerName}`,
    `Телефон: ${order.phone}`,
  ];

  const email = clean(order.email);
  if (email) lines.push(`Email: ${email}`);

  if (delivery) lines.push(`Доставка (Нова Пошта): ${delivery}`);

  lines.push("", "Товари:", ...order.items.map(formatItem), "", `Сума: ${money(order.total)}`, `Оплата: ${payment}`);

  const comment = clean(order.comment);
  if (comment) lines.push("", `Коментар: ${comment}`);

  lines.push("", `Замовлення в адмінці: ${adminUrl}`);

  return lines.join("\n");
}

export function formatPaidMessage(orderNumber: string, total: MoneyLike): string {
  return `Замовлення ${orderNumber} оплачено карткою. Сума: ${money(total)}`;
}

let missingConfigWarned = false;

// Ніколи не кидає виняток: збій сповіщення не повинен ламати оформлення
// замовлення чи обробку вебхука. Токен і URL з токеном у логи не потрапляють.
export async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    if (!missingConfigWarned) {
      missingConfigWarned = true;
      console.warn("Telegram-сповіщення вимкнені: не задано TELEGRAM_BOT_TOKEN або TELEGRAM_CHAT_ID");
    }
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      console.error(`Telegram: не вдалося надіслати повідомлення, статус ${response.status}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "невідома помилка";
    console.error(`Telegram: помилка надсилання повідомлення: ${message.split(token).join("***")}`);
  }
}

// Лише для тестів: скидає прапорець одноразового попередження.
export function resetTelegramWarningForTests(): void {
  missingConfigWarned = false;
}
