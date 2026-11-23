import { z } from "zod";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/orders/build-order";
import { normalizeUaPhone } from "@/lib/phone";

export const MAX_ORDER_ITEMS = 30;

const WORD = "[A-Za-zА-Яа-яЁёҐґЄєІіЇї]";
// Слово: літери (кирилиця/латиниця), всередині між літерами допускаються ' і -
// (О'Коннор, Анна-Марія). Довжина слова 2-30 перевіряється окремо.
// Ім'я: 2 або 3 такі слова через один пробіл.
const NAME_WORD = `${WORD}+(?:['-]${WORD}+)*`;
const NAME_REGEX = new RegExp(`^${NAME_WORD}(?: ${NAME_WORD}){1,2}$`);

const NAME_ERROR = "Вкажіть ім'я та прізвище, наприклад: Марія Іваненко";

function normalizeName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[’ʼ`]/g, "'");
}

const customerNameSchema = z
  .string()
  .max(200, NAME_ERROR)
  .transform(normalizeName)
  .refine(
    (v) => v.length <= 60 && NAME_REGEX.test(v) && v.split(" ").every((w) => w.length >= 2 && w.length <= 30),
    NAME_ERROR,
  );

const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PHONE_ERROR = "Вкажіть український мобільний номер, наприклад 050 123 45 67";

export const checkoutFormSchema = z.object({
  customerName: customerNameSchema,
  phone: z
    .string()
    .trim()
    .max(20, PHONE_ERROR)
    .transform((v, ctx) => {
      const normalized = normalizeUaPhone(v);
      if (normalized === null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: PHONE_ERROR });
        return z.NEVER;
      }
      return normalized;
    }),
  email: z
    .string()
    .trim()
    .max(100)
    .email("Некоректний email")
    .optional()
    .or(z.literal("")),
  shippingCity: z.string().trim().min(2, "Вкажіть місто").max(100),
  shippingCityRef: z.string().trim().regex(GUID_REGEX, "Оберіть місто зі списку"),
  shippingWarehouse: z.string().trim().min(1, "Вкажіть відділення Нової Пошти").max(200),
  shippingWarehouseRef: z.string().trim().regex(GUID_REGEX, "Оберіть відділення зі списку"),
  // ONLINE_CARD - провайдер-агностична опція: яка платіжка (LiqPay/Monobank)
  // реально обробить оплату вирішує сервер через PAYMENT_PROVIDER
  // (src/lib/payment/index.ts), а не клієнт.
  paymentMethod: z.enum(["ONLINE_CARD", "CASH_ON_DELIVERY"]),
  comment: z.string().trim().max(500, "Коментар до 500 символів").optional(),
});

/** Стан форми (до нормалізації). */
export type CheckoutFormInput = z.input<typeof checkoutFormSchema>;
/** Результат парсингу (телефон вже 380XXXXXXXXX). */
export type CheckoutFormValues = z.output<typeof checkoutFormSchema>;

const attributionValue = z.string().max(200).optional();

// Джерело переходу покупця. Клієнту не довіряємо: зайві ключі відкидаються
// (strip), а невалідна атрибуція (наприклад, рядок довший за 200 символів)
// не ламає замовлення, а просто вважається відсутньою (.catch).
const attributionSchema = z
  .object({
    utm_source: attributionValue,
    utm_medium: attributionValue,
    utm_campaign: attributionValue,
    utm_content: attributionValue,
    utm_term: attributionValue,
    fbclid: attributionValue,
    landing: attributionValue,
    referrer: attributionValue,
    capturedAt: attributionValue,
  })
  .optional()
  .catch(undefined);

export const createOrderSchema = checkoutFormSchema.extend({
  // Поле-пастка для ботів, мінімальний час заповнення і токен Turnstile (AS-04..06).
  website: z.string().max(200).optional(),
  fillMs: z.number().int().min(0).max(86_400_000).optional(),
  turnstileToken: z.string().max(4096).optional(),
  attribution: attributionSchema,
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z
          .number()
          .int()
          .min(1)
          .max(MAX_QUANTITY_PER_ITEM, `Максимум ${MAX_QUANTITY_PER_ITEM} шт. одного товару`),
      })
    )
    .min(1, "Кошик порожній")
    .max(MAX_ORDER_ITEMS, `Максимум ${MAX_ORDER_ITEMS} позицій у замовленні`)
    // Дублікати одного variantId склеюються в buildOrderItems, тому сумарна
    // кількість по варіанту теж не може перевищувати ліміт.
    .superRefine((items, ctx) => {
      const totals = new Map<string, number>();
      for (const item of items) {
        totals.set(item.variantId, (totals.get(item.variantId) ?? 0) + item.quantity);
      }
      for (const total of totals.values()) {
        if (total > MAX_QUANTITY_PER_ITEM) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Максимум ${MAX_QUANTITY_PER_ITEM} шт. одного товару`,
          });
          return;
        }
      }
    }),
});
