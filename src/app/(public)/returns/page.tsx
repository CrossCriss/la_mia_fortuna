import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Повернення/обмін",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-[36px] font-semibold text-ink">Повернення/обмін</h1>

      <div className="space-y-4 text-sm leading-relaxed text-ink-soft">
        <p>
          Якщо взуття не підійшло за розміром або не сподобалось, його можна обміняти чи повернути
          протягом 14 днів з дня отримання замовлення.
        </p>

        <h2 className="pt-2 font-display text-[24px] font-semibold text-ink">
          Умови обміну та повернення
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Взуття не було у використанні: його не носили на вулиці.</li>
          <li>Збережено товарний вигляд, ярлики та оригінальну коробку.</li>
        </ul>

        <h2 className="pt-2 font-display text-[24px] font-semibold text-ink">Як оформити</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Напишіть нам у Viber або Telegram протягом 14 днів з дня отримання. Вкажіть номер
            замовлення і що саме хочете: обмін чи повернення.
          </li>
          <li>Ми підтвердимо звернення і надішлемо дані для відправки.</li>
          <li>
            Надішліть взуття Новою Поштою на ці дані. Доставку при обміні чи поверненні сплачує
            покупець.
          </li>
          <li>
            Після отримання і перевірки взуття ми надішлемо вам іншу пару або повернемо кошти.
          </li>
        </ol>

        <h2 className="pt-2 font-display text-[24px] font-semibold text-ink">Повернення коштів</h2>
        <p>
          Кошти повертаємо протягом 7 календарних днів після того, як отримаємо і перевіримо
          повернене взуття. Якщо ви оплачували карткою онлайн, кошти надійдуть на ту саму картку.
          Якщо оплата була накладеним платежем, ми переказуємо кошти на картку, реквізити якої ви
          нам надасте.
        </p>

        <h2 className="pt-2 font-display text-[24px] font-semibold text-ink">
          Якщо виявили брак
        </h2>
        <p>
          Напишіть нам одразу, як помітили брак, і додайте фото. Доставку бракованого взуття ми
          оплачуємо самі, а вам на вибір обміняємо його на таку ж якісну пару або повернемо кошти.
        </p>
      </div>
    </div>
  );
}
