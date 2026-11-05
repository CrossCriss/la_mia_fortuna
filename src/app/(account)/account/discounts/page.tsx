import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLoyaltySummary, DISCOUNT_TIERS } from "@/lib/loyalty";
import { formatPrice } from "@/lib/format-price";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountDiscountsPage() {
  const session = await getServerSession(authOptions);
  const summary = await getLoyaltySummary(session!.user.id);

  const currentTierMax = summary.tier.max ?? summary.tier.min;
  const rangeSize = currentTierMax - summary.tier.min;
  const progressPercent = summary.nextTier
    ? Math.min(100, rangeSize > 0 ? ((summary.totalSpent - summary.tier.min) / rangeSize) * 100 : 100)
    : 100;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Накопичувальні знижки</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Знижка рахується від суми всіх ваших оплачених/виконаних замовлень і застосовується
        автоматично до наступної покупки.
      </p>

      <div className="mt-6 rounded-card border border-border bg-surface p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-soft">Накопичено: {formatPrice(summary.totalSpent)}</span>
          {summary.nextTier && (
            <span className="text-ink-soft">
              До {summary.nextTier.label}: {formatPrice(summary.amountToNextTier ?? 0)}
            </span>
          )}
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary/40">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/30 text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">Рівень</th>
              <th className="px-4 py-3 font-medium">Сума замовлень</th>
              <th className="px-4 py-3 font-medium">Знижка</th>
            </tr>
          </thead>
          <tbody>
            {DISCOUNT_TIERS.map((tier) => {
              const isCurrent = tier.label === summary.tier.label;
              return (
                <tr
                  key={tier.label}
                  className={cn("border-t border-border", isCurrent && "bg-accent/10")}
                >
                  <td className="px-4 py-3 font-semibold text-ink">
                    {tier.label}
                    {isCurrent && (
                      <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">
                        Ваш рівень
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {tier.max ? `${formatPrice(tier.min)} – ${formatPrice(tier.max)}` : `від ${formatPrice(tier.min)}`}
                  </td>
                  <td className="px-4 py-3 font-semibold text-accent">{tier.percent}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
