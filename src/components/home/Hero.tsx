import Link from "next/link";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";

const STATS = [
  { value: "15 років", label: "досвіду в продажах" },
  { value: "40 000", label: "підписників в Instagram" },
  { value: "35 до 41", label: "розмірний ряд" },
];

export function Hero({
  image,
  imageAlt = "Головне фото колекції",
}: {
  image?: string;
  imageAlt?: string;
}) {
  return (
    <section>
      <div className="mx-auto max-w-6xl gap-12 px-4 py-6 md:flex md:items-center md:gap-12 md:px-10 md:py-12">
        <div className="flex-1">
          <span className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">
            Нова колекція · Зима 2027
          </span>
          <h1 className="mt-5 font-display text-[44px] font-semibold leading-[1.02] text-ink md:text-[64px] lg:text-[76px]">
            Взуття з натуральної шкіри, зроблене з любов&apos;ю
          </h1>
          <p className="mt-5 max-w-[520px] text-lg text-ink-soft">
            Власне виробництво в Харкові і 15 років досвіду. Тепле хутро всередині, комфорт з
            першого кроку, розміри 36 до 41.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/catalog/zhinoche-vzuttya"
              className="inline-flex min-h-[52px] items-center bg-accent px-8 text-[15px] font-semibold tracking-wide text-white hover:bg-accent-dark"
            >
              Дивитись колекцію
            </Link>
            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[52px] items-center border border-ink px-8 text-[15px] font-semibold tracking-wide text-ink hover:bg-ink hover:text-background"
            >
              Написати в Telegram
            </a>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-10 gap-y-3 border-t border-border pt-4">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-[32px] font-semibold leading-none text-ink">
                  {stat.value}
                </div>
                <div className="text-[13px] text-ink-soft">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-8 flex-1 md:mt-0">
          <div className="h-[420px] overflow-hidden bg-surface-dark md:h-[600px]">
            {image ? (
              <img src={image} alt={imageAlt} className="h-full w-full object-cover" />
            ) : (
              <PlaceholderImage className="text-background/70" />
            )}
          </div>
          <div className="absolute bottom-6 left-6 flex max-w-[260px] flex-col gap-0.5 bg-background px-5 py-4">
            <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-accent">
              Зима 2027
            </span>
            <span className="font-display text-xl font-semibold text-ink">Черевики з хутром</span>
            <span className="text-sm text-ink-soft">Чорний, шоколадний · 36 до 41</span>
            <span className="mt-1 text-base font-bold text-ink">2 900 грн</span>
          </div>
        </div>
      </div>
    </section>
  );
}
