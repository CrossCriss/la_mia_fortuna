"use client";

import { useLayoutEffect, useRef } from "react";
import { computeMaskedPhoneEdit, looksLikePhoneRaw } from "@/lib/phone";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
  // Поле приймає і телефон, і довільний текст (email). Режим "липкий": рішення
  // приймається один раз на старті вводу (з першого символу в порожньому полі)
  // і не переоцінюється на кожному наступному натисканні — інакше єдина
  // випадкова літера серед цифр (одруківка) перемикала б усе поле в
  // "email"-режим і застрягала б у значенні замість того, щоб просто
  // ігноруватись маскою (саме так і виглядав попередній регрес).
  // "@" — єдиний сигнал, що форсує email-режим у будь-який момент, бо в
  // телефоні цей символ у принципі неможливий, а в email він практично завжди є.
  allowFreeText?: boolean;
};

// Контрольований інпут з маскою телефону, що на кожній зміні перебудовує
// весь рядок з нуля з чистих цифр (computeMaskedPhoneEdit) і сама відновлює
// позицію курсора — без цього React після setState завжди кидає курсор
// в кінець значення, ламаючи Backspace/редагування всередині рядка.
export function PhoneMaskField({
  value,
  onValueChange,
  allowFreeText,
  type = "tel",
  ...rest
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCursor = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (pendingCursor.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(pendingCursor.current, pendingCursor.current);
      pendingCursor.current = null;
    }
  }, [value]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value;

    if (allowFreeText) {
      const alreadyFreeText = value.length > 0 && !looksLikePhoneRaw(value);
      const justStartedAsFreeText = value.length === 0 && !looksLikePhoneRaw(raw);
      if (alreadyFreeText || raw.includes("@") || justStartedAsFreeText) {
        onValueChange(raw);
        return;
      }
    }

    const cursorPos = event.target.selectionStart ?? raw.length;
    const result = computeMaskedPhoneEdit(raw, cursorPos);
    pendingCursor.current = result.cursorPos;
    onValueChange(result.value);
  }

  return <input ref={inputRef} type={type} value={value} onChange={handleChange} {...rest} />;
}
