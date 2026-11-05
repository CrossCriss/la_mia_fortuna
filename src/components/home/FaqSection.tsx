"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Тимчасові плейсхолдер-відповіді — реальні деталі доставки/повернення ще
// очікуємо від клієнтки (той самий відкритий пункт, що й сторінки
// Доставка/Повернення, див. CLAUDE.md).
const FAQ_ITEMS = [
  {
    question: "Як оформити замовлення?",
    answer:
      "Додайте товар у кошик, оберіть розмір і колір, перейдіть до оформлення. Реєстрація не обов'язкова — достатньо вказати контактні дані та адресу доставки.",
  },
  {
    question: "Які способи оплати?",
    answer:
      "Оплата при отриманні (накладений платіж) або онлайн-оплата карткою. Спосіб оплати обирається на сторінці оформлення замовлення.",
  },
  {
    question: "Скільки триває доставка?",
    answer:
      "Зазвичай 1-3 робочі дні по Україні через Нову Пошту, залежно від міста доставки та наявності товару на складі.",
  },
  {
    question: "Чи є безкоштовна доставка?",
    answer:
      "Умови безкоштовної доставки уточнюються — слідкуйте за оновленнями на сайті або запитайте у менеджера при оформленні замовлення.",
  },
  {
    question: "Як здійснити повернення/обмін?",
    answer:
      "Товар можна повернути або обміняти протягом 14 днів з моменту отримання, якщо він не був у використанні та збережено товарний вигляд. Деталі уточнюються у менеджера.",
  },
  {
    question: "Як підібрати розмір?",
    answer:
      "На сторінці кожного товару є таблиця розмірів з вимірами. Якщо сумніваєтесь між двома розмірами — оберіть більший або напишіть нам, порадимо.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mt-12">
      <h2 className="font-display text-xl font-bold">Поширені питання</h2>
      <div className="mt-4 divide-y divide-border rounded-card border border-border bg-surface">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={item.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-bold text-ink">{item.question}</span>
                <span
                  className={cn(
                    "shrink-0 text-xl text-ink-soft transition-transform duration-200 ease-out",
                    isOpen && "rotate-45"
                  )}
                >
                  +
                </span>
              </button>
              <div
                className={cn(
                  "grid transition-all duration-200 ease-out",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-4 text-sm leading-relaxed text-ink-soft">{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
