const BENEFITS = [
  {
    title: "Власне виробництво",
    text: "Взуття шиють на фабриці в Харкові, тому ціна чесна, а якість під контролем.",
  },
  {
    title: "Натуральна шкіра",
    text: "Зовні шкіра, всередині тепле хутро. Взуття, в якому комфортно всю зиму.",
  },
  {
    title: "Швидка відправка",
    text: "Збираємо і відправляємо замовлення швидко, щоб пара була у тебе вчасно.",
  },
  {
    title: "Допомога з розміром",
    text: "Підкажемо розмір за довжиною стопи. Пишіть у Telegram або Viber, відповідаємо швидко.",
  },
];

export function BenefitsSection() {
  return (
    <section className="py-12">
      <h2 className="max-w-xl font-display text-[32px] font-semibold leading-[1.05] text-ink md:text-[42px]">
        Чому дівчата повертаються до нас
      </h2>
      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map((benefit) => (
          <div key={benefit.title} className="flex flex-col gap-2 border-t-2 border-ink pt-5">
            <span className="font-display text-xl font-semibold text-ink">{benefit.title}</span>
            <span className="text-sm text-ink-soft">{benefit.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
