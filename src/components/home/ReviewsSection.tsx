type ReviewImage = { src: string; alt: string };

type ReviewsSectionProps = {
  reviews: ReviewImage[];
};

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 md:px-10">
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">
          Відгуки
        </span>
        <h2 className="font-display text-[32px] font-semibold leading-[1.05] text-ink md:text-[42px]">
          Живі відгуки клієнток
        </h2>
      </div>
      <div className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
        {reviews.map((review) => (
          <img
            key={review.src}
            src={review.src}
            alt={review.alt}
            loading="lazy"
            className="h-[420px] w-auto max-w-[80vw] shrink-0 snap-start bg-secondary/25 object-contain"
          />
        ))}
      </div>
    </section>
  );
}
