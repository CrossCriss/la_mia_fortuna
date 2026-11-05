// Автоматичний Next.js loading-стан під час завантаження даних сторінки
// категорії (App Router). Тільки статичний skeleton, без жодної логіки.
export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8">
      <div className="h-8 w-56 rounded bg-neutral-200" />

      <div className="mt-6 flex flex-col gap-8 md:flex-row">
        <aside className="w-full shrink-0 md:w-56">
          <div className="mb-6">
            <div className="mb-2 h-4 w-16 rounded bg-neutral-200" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 w-12 rounded-full bg-neutral-200" />
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 h-4 w-20 rounded bg-neutral-200" />
            <div className="flex gap-2">
              <div className="h-8 w-20 rounded bg-neutral-200" />
              <div className="h-8 w-20 rounded bg-neutral-200" />
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 lg:gap-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[3/4] rounded-photo bg-neutral-200" />
                <div className="mt-2.5 space-y-1.5">
                  <div className="h-4 w-4/5 rounded bg-neutral-200" />
                  <div className="h-4 w-1/3 rounded bg-neutral-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
