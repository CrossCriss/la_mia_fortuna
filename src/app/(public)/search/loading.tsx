// Автоматичний Next.js loading-стан під час завантаження результатів
// пошуку (App Router). Тільки статичний skeleton, без жодної логіки.
export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8">
      <div className="h-8 w-80 rounded bg-neutral-200" />
      <div className="mt-2 h-4 w-40 rounded bg-neutral-200" />

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 lg:gap-8">
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
  );
}
