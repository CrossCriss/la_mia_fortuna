import type { Metadata } from "next";

// Оформлення замовлення - клієнтська сторінка, тому метадані задаються в layout.
export const metadata: Metadata = {
  title: "Оформлення замовлення",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
