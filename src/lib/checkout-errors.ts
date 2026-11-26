// Коди й тексти відмов чекауту. Без серверних імпортів: використовується і роутом, і чекаутом.
import { COD_MAX_PAIRS, type CodDenyReason } from "@/lib/orders/cod-policy";

export const CHECKOUT_ERROR_CODES = {
  COD_UNAVAILABLE: "COD_UNAVAILABLE",
  COD_TOO_MANY_PAIRS: "COD_TOO_MANY_PAIRS",
  CHECK_FAILED: "CHECK_FAILED",
  ADDRESS_INVALID: "ADDRESS_INVALID",
  EMAIL_INVALID: "EMAIL_INVALID",
} as const;

export type CheckoutErrorCode =
  (typeof CHECKOUT_ERROR_CODES)[keyof typeof CHECKOUT_ERROR_CODES];

// BLOCKED і PHONE_LIMIT дають однаковий код, щоб не розкривати, що спрацювало.
export function codReasonToCode(reason: CodDenyReason): CheckoutErrorCode {
  if (reason === "TOO_MANY_PAIRS") return CHECKOUT_ERROR_CODES.COD_TOO_MANY_PAIRS;
  return CHECKOUT_ERROR_CODES.COD_UNAVAILABLE;
}

export function getCheckoutErrorMessage(
  code: CheckoutErrorCode,
  { onlineEnabled }: { onlineEnabled: boolean },
): string {
  switch (code) {
    case "COD_UNAVAILABLE":
      return onlineEnabled
        ? "Для цього замовлення доступна лише оплата карткою онлайн. Оберіть її або напишіть нам у Telegram чи Viber, і ми допоможемо оформити замовлення."
        : "На жаль, зараз не вдалося оформити це замовлення на сайті. Напишіть нам у Telegram чи Viber або зателефонуйте, і ми оформимо його для вас.";
    case "COD_TOO_MANY_PAIRS":
      return onlineEnabled
        ? `Накладеним платежем можна замовити до ${COD_MAX_PAIRS} пар. Оберіть оплату карткою онлайн або напишіть нам у Telegram чи Viber, і ми оформимо більше замовлення.`
        : `На сайті можна оформити до ${COD_MAX_PAIRS} пар в одному замовленні. Щоб замовити більше, напишіть нам у Telegram чи Viber, і ми оформимо замовлення для вас.`;
    case "CHECK_FAILED":
      return "Не вдалося оформити замовлення. Оновіть сторінку і спробуйте ще раз. Якщо не вийде, напишіть нам у Telegram чи Viber.";
    case "ADDRESS_INVALID":
      return "Не вдалося знайти вибране відділення. Оберіть місто і відділення зі списку ще раз.";
    case "EMAIL_INVALID":
      return "Перевірте email: такої поштової адреси не існує. Або залиште поле порожнім.";
  }
}
