import { PlaceholderImage } from "@/components/ui/PlaceholderImage";

const TILE_COUNT = 6;

// Плейсхолдер-плитки — реальна стрічка Instagram не підключена (окреме
// завдання), поки показуємо заглушки замість фото.
export function InstagramTeaser() {
  return (
    <section className="bg-surface py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">
              Instagram
            </span>
            <h2 className="font-display text-[32px] font-semibold leading-[1.05] text-ink md:text-[38px]">
              @la_mia_fortuna_shoes
            </h2>
          </div>
          <a
            href="https://www.instagram.com/la_mia_fortuna_shoes"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center border border-ink px-7 text-[15px] font-semibold text-ink hover:bg-ink hover:text-background"
          >
            Підписатись
          </a>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {Array.from({ length: TILE_COUNT }).map((_, index) => (
            <div key={index} className="aspect-square">
              <PlaceholderImage compact />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
