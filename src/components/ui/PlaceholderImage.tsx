import { cn } from "@/lib/utils";

// Заглушка "нема фото" — рендериться інлайн-компонентом, а не файлом у /public.
// Так шлях до заглушки ніколи не потрапляє в ProductImage.url і не може розійтися
// зі своїм відображенням (як сталося зі старими SVG-силуетами).
export function PlaceholderImage({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary/30 text-ink-soft",
        className
      )}
    >
      <svg
        viewBox="0 0 100 100"
        className={compact ? "h-6 w-6" : "h-10 w-10"}
        fill="none"
        stroke="currentColor"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M50,32 q0,-8 8,-6 q5,2 1,7" />
        <path d="M24,58 Q50,68 76,58 L50,38 Z" />
      </svg>
      {!compact && <span className="text-xs font-medium">Фото товару</span>}
    </div>
  );
}
