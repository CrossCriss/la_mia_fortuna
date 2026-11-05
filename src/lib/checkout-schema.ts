import { z } from "zod";

// Приймає 0501234567, +380501234567 або 380501234567.
const PHONE_REGEX = /^(\+?38)?0\d{9}$/;

export const checkoutFormSchema = z.object({
  customerName: z.string().trim().min(2, "Вкажіть ім'я та прізвище"),
  phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, "Телефон у форматі 0501234567 або +380501234567"),
  email: z
    .string()
    .trim()
    .email("Некоректний email")
    .optional()
    .or(z.literal("")),
  shippingCity: z.string().trim().min(2, "Вкажіть місто"),
  shippingCityRef: z.string().trim().min(1, "Оберіть місто зі списку"),
  shippingWarehouse: z.string().trim().min(1, "Вкажіть відділення Нової Пошти"),
  shippingWarehouseRef: z.string().trim().min(1, "Оберіть відділення зі списку"),
  // ONLINE_CARD — провайдер-агностична опція: яка платіжка (LiqPay/Monobank)
  // реально обробить оплату вирішує сервер через PAYMENT_PROVIDER
  // (src/lib/payment/index.ts), а не клієнт.
  paymentMethod: z.enum(["ONLINE_CARD", "CASH_ON_DELIVERY"]),
  comment: z.string().trim().optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export const createOrderSchema = checkoutFormSchema.extend({
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "Кошик порожній"),
});
