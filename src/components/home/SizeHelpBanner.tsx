export function SizeHelpBanner() {
  return (
    <section className="bg-surface-dark px-4 py-14 text-background md:px-10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-8">
        <div className="flex max-w-[560px] flex-col gap-3">
          <span className="text-[13px] font-bold uppercase tracking-[0.18em] text-tertiary">
            Вибір розміру
          </span>
          <h2 className="font-display text-[32px] font-semibold leading-[1.05] md:text-[40px]">
            Не впевнена з розміром?
          </h2>
          <p className="text-[17px] text-background/85">
            Надішли довжину стопи в сантиметрах, і ми підкажемо розмір саме для цієї моделі. Так
            менше повернень і більше задоволених клієнток.
          </p>
        </div>
        <a
          href="https://t.me"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[52px] items-center bg-background px-8 text-[15px] font-semibold text-ink hover:bg-surface"
        >
          Запитати в месенджері
        </a>
      </div>
    </section>
  );
}
