import { cn } from "@/lib/utils";

export type BadgeVariant = "sale" | "new" | "bestseller" | "neutral";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  sale: "bg-sale text-white font-sans",
  new: "bg-surface-dark text-background font-sans",
  bestseller: "bg-tertiary text-surface-dark font-sans",
  neutral: "bg-background text-ink font-sans",
};

export function Badge({
  variant,
  className,
  children,
}: {
  variant: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
