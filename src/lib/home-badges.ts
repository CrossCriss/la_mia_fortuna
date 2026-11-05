import type { BadgeVariant } from "@/components/ui/Badge";

const NEW_BADGE_DAYS = 14;
const LOW_STOCK_THRESHOLD = 5;
const MAX_BADGES = 2;

export type HomeBadge = { label: string; variant: BadgeVariant };

// Пріоритет для секцій-підбірок на головній: Топ продажів > Новинка (за
// createdAt) > Останні одиниці. Максимум 2 бейджі, щоб не захаращувати
// картку. Це окрема система від isNew/isPromo (ті — для каталогу).
export function getHomeBadges(product: {
  isFeatured: boolean;
  createdAt: Date;
  totalStock: number;
}): HomeBadge[] {
  const badges: HomeBadge[] = [];

  if (product.isFeatured) {
    badges.push({ label: "Топ продажів", variant: "bestseller" });
  }

  const ageMs = Date.now() - product.createdAt.getTime();
  if (ageMs < NEW_BADGE_DAYS * 24 * 60 * 60 * 1000) {
    badges.push({ label: "Новинка", variant: "new" });
  }

  if (product.totalStock <= LOW_STOCK_THRESHOLD) {
    badges.push({ label: "Останні одиниці", variant: "sale" });
  }

  return badges.slice(0, MAX_BADGES);
}
