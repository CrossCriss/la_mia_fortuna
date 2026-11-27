import type { Metadata } from "next";
import { ErrorScreen } from "@/components/errors/ErrorScreen";

export const metadata: Metadata = {
  title: "Сторінку не знайдено",
};

// Запасна сторінка 404 для notFound() поза групою (public), наприклад в адмінці.
export default function NotFound() {
  return (
    <ErrorScreen
      title="Сторінку не знайдено"
      text="Можливо, товар уже продано або посилання застаріло. Перегляньте каталог, там багато іншого гарного взуття."
    />
  );
}
