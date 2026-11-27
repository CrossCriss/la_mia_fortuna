import type { Metadata } from "next";
import { ErrorScreen } from "@/components/errors/ErrorScreen";

export const metadata: Metadata = {
  title: "Сторінку не знайдено",
};

export default function NotFound() {
  return (
    <ErrorScreen
      title="Сторінку не знайдено"
      text="Можливо, товар уже продано або посилання застаріло. Перегляньте каталог, там багато іншого гарного взуття."
    />
  );
}
