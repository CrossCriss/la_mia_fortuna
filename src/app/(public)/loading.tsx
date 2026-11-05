// Автоматичний Next.js loading-стан під час завантаження даних головної
// сторінки (App Router). Тільки статичний skeleton, без жодної логіки.
export default function HomeLoading() {
  return (
    <div className="animate-pulse">
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
          <div className="grid gap-6 md:grid-cols-2 md:items-center md:gap-12">
            <div className="h-[45vh] rounded-photo bg-neutral-200 md:order-2 md:h-[520px]" />

            <div className="md:order-1">
              <div className="mx-auto h-8 w-4/5 rounded bg-neutral-200 md:mx-0 md:h-10" />
              <div className="mx-auto mt-3 h-8 w-3/5 rounded bg-neutral-200 md:mx-0" />
              <div className="mx-auto mt-4 h-4 w-full max-w-md rounded bg-neutral-200 md:mx-0" />
              <div className="mx-auto mt-2 h-4 w-4/5 max-w-md rounded bg-neutral-200 md:mx-0" />
              <div className="mx-auto mt-8 h-12 w-40 rounded-full bg-neutral-200 md:mx-0" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {Array.from({ length: 2 }).map((_, sectionIndex) => (
          <section key={sectionIndex} className={sectionIndex === 0 ? "" : "mt-12"}>
            <div className="flex items-center justify-between">
              <div className="h-6 w-48 rounded bg-neutral-200" />
              <div className="h-4 w-24 rounded bg-neutral-200" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 lg:gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="aspect-[3/4] rounded-photo bg-neutral-200" />
                  <div className="mt-2.5 space-y-1.5">
                    <div className="h-4 w-4/5 rounded bg-neutral-200" />
                    <div className="h-4 w-1/3 rounded bg-neutral-200" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="mt-12 h-28 rounded-card bg-neutral-200" />

        <section className="mt-12">
          <div className="h-6 w-32 rounded bg-neutral-200" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 rounded-card bg-neutral-200" />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="h-6 w-56 rounded bg-neutral-200" />
          <div className="mt-4 space-y-2 rounded-card border border-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded bg-neutral-200" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
