import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AccountNav } from "@/components/account/AccountNav";

// Доступ до /account/* захищено middleware.ts (перевірка NextAuth JWT).
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-ink">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="grid gap-8 md:grid-cols-[220px_1fr]">
          <AccountNav />
          <div>{children}</div>
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
