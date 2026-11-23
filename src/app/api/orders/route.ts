import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/checkout-schema";
import { getActivePaymentMethod, getPaymentProvider, isOnlinePaymentEnabled } from "@/lib/payment";
import { buildOrderItems, generateOrderNumber } from "@/lib/orders/build-order";
import type { PaymentInit } from "@/lib/payment/types";
import { getSiteUrl } from "@/lib/site-config";
import { formatNewOrderMessage, sendTelegramMessage } from "@/lib/notify/telegram";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { checkFormGuard } from "@/lib/antibot/form-guard";
import { verifyTurnstileToken } from "@/lib/antibot/turnstile";
import { COD_WINDOW_MS, countPairs, evaluateCod } from "@/lib/orders/cod-policy";
import { CHECKOUT_ERROR_CODES, codReasonToCode, getCheckoutErrorMessage } from "@/lib/checkout-errors";
import { verifyNovaPoshtaAddress } from "@/lib/delivery/nova-poshta";
import { phoneLookupVariants } from "@/lib/phone";

export const dynamic = "force-dynamic";

// POST /api/orders - створення замовлення при оформленні чекауту.
// "ONLINE_CARD" з форми резолвиться тут у реальний PaymentMethod (LIQPAY/
// MONOBANK) за PAYMENT_PROVIDER, і для нього одразу створюється рахунок у
// провайдера - клієнт отримає paymentInit і повинен перейти за ним
// (redirect-url або auto-submit форма), інакше замовлення лишиться NEW/PENDING.
// Клієнт надсилає лише variantId+quantity - ціна, назва, sku, розмір і колір
// підтягуються з БД тут, а не приймаються від клієнта як є.
const INVALID_ORDER_ERROR = "Некоректні дані замовлення";
const MAX_ORDER_NUMBER_ATTEMPTS = 3;
const ORDER_LIMIT = 10;
const ORDER_WINDOW_MS = 10 * 60 * 1000; // 10 хвилин

// 380XXXXXXXXX -> 380*****4567 (для логів без персональних даних)
function maskPhone(phone: string): string {
  return `${phone.slice(0, 3)}*****${phone.slice(-4)}`;
}

function isOrderNumberConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }
  const target = error.meta?.target;
  return Array.isArray(target) ? target.includes("orderNumber") : String(target ?? "").includes("orderNumber");
}

export async function POST(request: Request) {
  const limit = rateLimit(`order:${getClientIp(request)}`, ORDER_LIMIT, ORDER_WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Забагато запитів. Спробуйте трохи пізніше." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: INVALID_ORDER_ERROR }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: INVALID_ORDER_ERROR, issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const guard = checkFormGuard({ honeypot: parsed.data.website, fillMs: parsed.data.fillMs });
  if (!guard.ok) {
    console.warn(`Checkout: відхилено антиботом (${guard.reason})`);
    return NextResponse.json(
      {
        error: getCheckoutErrorMessage(CHECKOUT_ERROR_CODES.CHECK_FAILED, { onlineEnabled: isOnlinePaymentEnabled() }),
        code: CHECKOUT_ERROR_CODES.CHECK_FAILED,
      },
      { status: 400 }
    );
  }

  const turnstile = await verifyTurnstileToken(parsed.data.turnstileToken, getClientIp(request));
  if (turnstile === "failed") {
    console.warn("Checkout: відхилено Turnstile");
    return NextResponse.json(
      {
        error: getCheckoutErrorMessage(CHECKOUT_ERROR_CODES.CHECK_FAILED, { onlineEnabled: isOnlinePaymentEnabled() }),
        code: CHECKOUT_ERROR_CODES.CHECK_FAILED,
      },
      { status: 400 }
    );
  }
  if (turnstile === "unavailable") {
    console.error("Checkout: Turnstile недоступний, замовлення пропущено без перевірки");
  }

  if (parsed.data.paymentMethod === "ONLINE_CARD" && !isOnlinePaymentEnabled()) {
    return NextResponse.json(
      { error: "Оплата карткою тимчасово недоступна. Оберіть накладений платіж." },
      { status: 400 }
    );
  }

  // website, fillMs, turnstileToken використані вище і в заказ не потрапляють.
  const { items, email, comment, attribution, website, fillMs, turnstileToken, ...customer } = parsed.data;
  void website;
  void fillMs;
  void turnstileToken;

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: [...new Set(items.map((item) => item.variantId))] } },
    include: { product: true, size: true, color: true },
  });

  const built = buildOrderItems(items, variants);

  if (!built.ok) {
    return NextResponse.json(
      {
        error: "Деякі товари з кошика вже недоступні. Оновіть кошик і спробуйте ще раз.",
        unavailableVariantIds: built.unavailableVariantIds,
      },
      { status: 409 }
    );
  }

  const { orderItems, subtotal } = built;

  if (customer.paymentMethod === "CASH_ON_DELIVERY") {
    const [blocked, pendingCodOrders] = await Promise.all([
      prisma.blockedPhone.findUnique({ where: { phone: customer.phone } }),
      prisma.order.count({
        where: {
          paymentMethod: "CASH_ON_DELIVERY",
          status: "NEW",
          phone: { in: phoneLookupVariants(customer.phone) },
          createdAt: { gte: new Date(Date.now() - COD_WINDOW_MS) },
        },
      }),
    ]);
    const decision = evaluateCod({
      pairs: countPairs(orderItems),
      pendingCodOrders,
      isBlocked: blocked !== null,
    });
    if (!decision.allowed) {
      const code = codReasonToCode(decision.reason);
      console.info(`Checkout: накладений платіж відхилено (${decision.reason}), номер ${maskPhone(customer.phone)}`);
      return NextResponse.json(
        { error: getCheckoutErrorMessage(code, { onlineEnabled: isOnlinePaymentEnabled() }), code },
        { status: 422 }
      );
    }
  }

  const addressCheck = await verifyNovaPoshtaAddress(customer.shippingCityRef, customer.shippingWarehouseRef);
  if (addressCheck === "invalid") {
    return NextResponse.json(
      {
        error: getCheckoutErrorMessage(CHECKOUT_ERROR_CODES.ADDRESS_INVALID, { onlineEnabled: isOnlinePaymentEnabled() }),
        code: CHECKOUT_ERROR_CODES.ADDRESS_INVALID,
      },
      { status: 400 }
    );
  }
  const addressUnverified = addressCheck === "unavailable";

  const isOnlineCard = customer.paymentMethod === "ONLINE_CARD";
  const paymentMethod = isOnlineCard ? getActivePaymentMethod() : "CASH_ON_DELIVERY";

  const createOrder = (orderNumber: string) =>
    prisma.order.create({
      data: {
        orderNumber,
        status: "NEW",
        paymentMethod,
        customerName: customer.customerName,
        phone: `+${customer.phone}`,
        addressUnverified,
        email: email || undefined,
        shippingCity: customer.shippingCity,
        shippingCityRef: customer.shippingCityRef,
        shippingWarehouse: customer.shippingWarehouse,
        shippingWarehouseRef: customer.shippingWarehouseRef,
        comment: comment || undefined,
        attribution: attribution ? (attribution as Prisma.InputJsonValue) : undefined,
        subtotal,
        total: subtotal,
        items: { create: orderItems },
      },
      include: { items: true },
    });

  // Номер випадковий: у разі колізії (P2002 по orderNumber) пробуємо з новим номером.
  let order: Awaited<ReturnType<typeof createOrder>> | undefined;
  for (let attempt = 1; attempt <= MAX_ORDER_NUMBER_ATTEMPTS; attempt += 1) {
    try {
      order = await createOrder(generateOrderNumber(new Date()));
      break;
    } catch (error) {
      if (!isOrderNumberConflict(error) || attempt === MAX_ORDER_NUMBER_ATTEMPTS) {
        throw error;
      }
    }
  }

  if (!order) {
    throw new Error("Не вдалося створити замовлення");
  }

  // Сповіщення в Telegram-групу клієнтки. await обов'язковий: на serverless
  // незавершений запит обривається після відповіді. sendTelegramMessage не кидає.
  const notifyNewOrder = () =>
    sendTelegramMessage(formatNewOrderMessage(order, `${getSiteUrl()}/admin/orders/${order.id}`));

  if (!isOnlineCard) {
    await notifyNewOrder();
    return NextResponse.json(order, { status: 201 });
  }

  let paymentInit: PaymentInit;
  try {
    const provider = getPaymentProvider(paymentMethod as "LIQPAY" | "MONOBANK");
    const { invoiceId, init } = await provider.createPayment({
      orderNumber: order.orderNumber,
      amount: Number(order.total),
      description: `Замовлення ${order.orderNumber}, La Mia Fortuna Shoes`,
    });
    await prisma.order.update({ where: { id: order.id }, data: { paymentProviderInvoiceId: invoiceId } });
    paymentInit = init;
  } catch (error) {
    console.error("Не вдалося створити рахунок у платіжного провайдера:", error);
    return NextResponse.json(
      { error: "Не вдалося ініціювати оплату. Спробуйте ще раз або оберіть накладений платіж." },
      { status: 502 }
    );
  }

  // Якщо рахунок створити не вдалося (502 вище), клієнт бачить помилку і
  // замовлення лишається неоплаченим - сповіщення в такому випадку не шлемо.
  await notifyNewOrder();
  return NextResponse.json({ ...order, paymentInit }, { status: 201 });
}
