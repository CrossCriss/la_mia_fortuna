// Спільний контракт для платіжних провайдерів (LiqPay/Monobank), щоб чекаут
// і /api/orders не залежали від конкретного - активний вибирається
// PAYMENT_PROVIDER в src/lib/payment/index.ts.
export type PaymentInit =
  | { kind: "redirect"; url: string }
  | { kind: "form"; url: string; fields: Record<string, string> };

export type PaymentOrderInput = {
  orderNumber: string;
  amount: number; // у гривнях (не копійках) - провайдер сам конвертує за потреби
  description: string;
};

export type PaymentCreateResult = {
  invoiceId: string;
  init: PaymentInit;
};

export interface PaymentProvider {
  createPayment(order: PaymentOrderInput): Promise<PaymentCreateResult>;
}

// Результат розбору вебхука - спільний для обох провайдерів, щоб
// /api/orders/[id] (чи сам колбек-роут) оновлював Order однаково.
export type PaymentWebhookResult = {
  orderNumber: string;
  invoiceId: string;
  status: "PAID" | "FAILED" | "REFUNDED" | "PENDING";
  amount: number | null; // у гривнях; null, якщо провайдер не передав суму
  rawPayload: unknown;
};
