import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DiscountTier = {
  label: string;
  min: number;
  max: number | null; // null — верхньої межі немає (останній рівень)
  percent: number;
};

// Пороги/назви — за ТЗ (див. CLAUDE.md), назви рівнів там прямо не задані,
// тому "Старт/Срібний/Золотий/Преміум" — легко перейменувати.
export const DISCOUNT_TIERS: DiscountTier[] = [
  { label: "Старт", min: 0, max: 3000, percent: 3 },
  { label: "Срібний", min: 3000, max: 7000, percent: 5 },
  { label: "Золотий", min: 7000, max: 15000, percent: 7 },
  { label: "Преміум", min: 15000, max: null, percent: 10 },
];

// Замовлення рахується в накопичення лише коли гроші фактично підтверджені:
// - LiqPay (онлайн) → paymentStatus = PAID
// - Накладений платіж → status = DELIVERED (гроші отримані по факту доставки)
// Один OR-фільтр, спільний для суми накопичення й для лічильника замовлень —
// коли підключать реальний LiqPay, тут нічого міняти не доведеться.
export const LOYALTY_ELIGIBLE_ORDER_WHERE: Prisma.OrderWhereInput = {
  OR: [
    { paymentMethod: "LIQPAY", paymentStatus: "PAID" },
    { paymentMethod: "CASH_ON_DELIVERY", status: "DELIVERED" },
  ],
};

export function getTierForAmount(totalSpent: number): DiscountTier {
  return (
    [...DISCOUNT_TIERS].reverse().find((tier) => totalSpent >= tier.min) ?? DISCOUNT_TIERS[0]
  );
}

export type LoyaltySummary = {
  totalSpent: number;
  ordersCount: number;
  tier: DiscountTier;
  nextTier: DiscountTier | null;
  amountToNextTier: number | null;
};

// Рахується "наживо" з Order при кожному виклику — жодного кешованого поля,
// тому нема чого "перераховувати" й нічого не може застаріти.
export async function getLoyaltySummary(userId: string): Promise<LoyaltySummary> {
  const [aggregate, ordersCount] = await Promise.all([
    prisma.order.aggregate({
      where: { userId, ...LOYALTY_ELIGIBLE_ORDER_WHERE },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { userId, ...LOYALTY_ELIGIBLE_ORDER_WHERE } }),
  ]);

  const totalSpent = Number(aggregate._sum.total ?? 0);
  const tier = getTierForAmount(totalSpent);
  const tierIndex = DISCOUNT_TIERS.indexOf(tier);
  const nextTier = DISCOUNT_TIERS[tierIndex + 1] ?? null;

  return {
    totalSpent,
    ordersCount,
    tier,
    nextTier,
    amountToNextTier: nextTier ? Math.max(0, nextTier.min - totalSpent) : null,
  };
}
