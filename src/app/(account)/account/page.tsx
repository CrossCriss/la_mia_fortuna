import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLoyaltySummary } from "@/lib/loyalty";
import { formatPrice } from "@/lib/format-price";

export const dynamic = "force-dynamic";

export default async function AccountHomePage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const [user, summary] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    getLoyaltySummary(userId),
  ]);

  const greetingName = user?.name || user?.phone || user?.email || "";

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">
        Вітаємо{greetingName ? `, ${greetingName}` : ""}!
      </h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-border bg-surface p-5">
          <p className="text-sm text-ink-soft">Ваш рівень знижки</p>
          <p className="mt-1 font-display text-xl font-bold text-accent">
            {summary.tier.label} · {summary.tier.percent}%
          </p>
        </div>
        <div className="rounded-card border border-border bg-surface p-5">
          <p className="text-sm text-ink-soft">Оплачених замовлень</p>
          <p className="mt-1 font-display text-xl font-bold text-ink">{summary.ordersCount}</p>
        </div>
      </div>

      <div className="mt-4 rounded-card border border-border bg-surface p-5">
        {summary.nextTier ? (
          <p className="text-sm text-ink">
            До рівня <span className="font-semibold">{summary.nextTier.label}</span> (
            {summary.nextTier.percent}%) лишилось витратити{" "}
            <span className="font-semibold text-accent">
              {formatPrice(summary.amountToNextTier ?? 0)}
            </span>
            .
          </p>
        ) : (
          <p className="text-sm text-ink">Ви досягли максимального рівня знижки.</p>
        )}
        <Link href="/account/discounts" className="mt-2 inline-block text-sm text-accent underline">
          Переглянути всі рівні
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/account/orders"
          className="rounded-full border-2 border-ink px-6 py-3 text-sm font-bold text-ink transition hover:bg-ink hover:text-white"
        >
          Історія замовлень
        </Link>
        <Link
          href="/account/profile"
          className="rounded-full border-2 border-ink px-6 py-3 text-sm font-bold text-ink transition hover:bg-ink hover:text-white"
        >
          Редагувати профіль
        </Link>
      </div>
    </div>
  );
}
