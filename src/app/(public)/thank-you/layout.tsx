import type { Metadata } from "next";

// Сторінка подяки після замовлення не має бути в індексі пошукових систем.
export const metadata: Metadata = {
  title: "Дякуємо за замовлення",
  robots: { index: false, follow: false },
};

export default function ThankYouLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
