const STEPS = [
  {
    n: "1",
    title: "Обираєш модель",
    text: "Дивишся каталог, вибираєш колір і розмір. Не впевнена, питай нас.",
  },
  {
    n: "2",
    title: "Оформлюєш замовлення",
    text: "Прямо на сайті або в Telegram чи Viber. Підтвердимо і домовимось про деталі.",
  },
  {
    n: "3",
    title: "Отримуєш пару",
    text: "Швидко відправляємо по Україні. Приміряєш і насолоджуєшся.",
  },
];

export function HowToOrderSteps() {
  return (
    <section className="py-14">
      <h2 className="font-display text-[32px] font-semibold leading-[1.05] text-ink md:text-[42px]">
        Як замовити
      </h2>
      <div className="mt-10 grid gap-8 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.n} className="flex gap-5">
            <span className="font-display text-[56px] font-semibold leading-[0.9] text-accent">
              {step.n}
            </span>
            <div className="flex flex-col gap-1.5">
              <span className="text-[18px] font-bold text-ink">{step.title}</span>
              <span className="text-sm text-ink-soft">{step.text}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
