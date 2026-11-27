import { formatAttribution } from "@/lib/notify/telegram";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/admin/order-labels";

// Чиста збірка CSV замовлень для української версії Excel:
// BOM на початку, роздільник ";", рядки через CRLF.

type MoneyLike = number | string | { toString(): string };

export interface CsvOrderItem {
  productName: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
}

export interface CsvOrder {
  orderNumber: string;
  createdAt: Date;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  customerName: string;
  phone: string;
  email?: string | null;
  shippingCity?: string | null;
  shippingWarehouse?: string | null;
  trackingNumber?: string | null;
  comment?: string | null;
  total: MoneyLike;
  attribution?: unknown;
  items: CsvOrderItem[];
}

const BOM = "﻿";
const SEP = ";";
const EOL = "\r\n";

const HEADERS = [
  "Номер",
  "Дата",
  "Статус",
  "Оплата",
  "Статус оплати",
  "Клієнт",
  "Телефон",
  "Email",
  "Місто",
  "Відділення",
  "Товари",
  "Кількість пар",
  "Сума, грн",
  "ТТН",
  "Коментар",
  "Джерело",
];

function guardFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function escapeCell(value: string): string {
  const guarded = guardFormula(value);
  if (/[;"\r\n]/.test(guarded)) return `"${guarded.replace(/"/g, '""')}"`;
  return guarded;
}

function formatDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Kyiv",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")}.${get("month")}.${get("year")} ${get("hour")}:${get("minute")}`;
}

function formatAmount(value: MoneyLike): string {
  const n = Number(typeof value === "object" ? value.toString() : value);
  return (Number.isFinite(n) ? n : 0).toFixed(2).replace(".", ",");
}

function formatPhone(phone: string): string {
  const m = /^\+380(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(phone.trim());
  return m ? `0${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone;
}

function formatItem(item: CsvOrderItem): string {
  const details = [
    item.size?.trim() && `розмір ${item.size.trim()}`,
    item.color?.trim() && `колір ${item.color.trim()}`,
  ]
    .filter(Boolean)
    .join(", ");
  const name = details ? `${item.productName} (${details})` : item.productName;
  return `${name} x ${item.quantity}`;
}

export function buildOrdersCsv(orders: CsvOrder[]): string {
  const rows = orders.map((order) => [
    order.orderNumber,
    formatDate(order.createdAt),
    ORDER_STATUS_LABELS[order.status] ?? order.status,
    PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod,
    PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus,
    order.customerName,
    formatPhone(order.phone),
    order.email ?? "",
    order.shippingCity ?? "",
    order.shippingWarehouse ?? "",
    order.items.map(formatItem).join("; "),
    String(order.items.reduce((sum, i) => sum + i.quantity, 0)),
    formatAmount(order.total),
    order.trackingNumber ?? "",
    order.comment ?? "",
    formatAttribution(order.attribution) ?? "",
  ]);
  const lines = [HEADERS, ...rows].map((cells) => cells.map(escapeCell).join(SEP));
  return BOM + lines.join(EOL);
}
