// Українські підписи статусів і способів оплати замовлень (ті самі, що на сторінках адмінки).

export const ORDER_STATUS_LABELS: Record<string, string> = {
  NEW: "Новий",
  CONFIRMED: "Підтверджено",
  SHIPPED: "Відправлено",
  DELIVERED: "Доставлено",
  CANCELED: "Скасовано",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  LIQPAY: "LiqPay",
  MONOBANK: "Monobank",
  CASH_ON_DELIVERY: "Накладений платіж",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Очікує",
  PAID: "Оплачено",
  FAILED: "Помилка",
  REFUNDED: "Повернено",
};
