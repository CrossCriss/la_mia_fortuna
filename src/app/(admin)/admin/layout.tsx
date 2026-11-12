import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";

const ADMIN_NAV = [
  { href: "/admin", label: "Огляд" },
  { href: "/admin/homepage", label: "Головна сторінка" },
  { href: "/admin/products", label: "Товари" },
  { href: "/admin/categories", label: "Категорії" },
  { href: "/admin/colors", label: "Кольори" },
  { href: "/admin/orders", label: "Замовлення" },
];

// Доступ до /admin/* захищено middleware.ts (перевірка сесійної cookie).
// На мобільному бокова панель ховається за гамбургер-меню (AdminMobileNav),
// на md+ лишається постійно видимою зліва.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900 md:flex-row">
      <aside className="hidden w-56 shrink-0 border-r border-neutral-200 bg-white p-4 md:block">
        <p className="mb-4 font-semibold">Адмінка</p>
        <nav className="flex flex-col gap-2 text-sm">
          {ADMIN_NAV.map((link) => (
            <Link key={link.href} href={link.href} className="rounded px-2 py-1 hover:bg-neutral-100">
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="relative flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:justify-end md:px-6">
          <div className="flex items-center gap-3 md:hidden">
            <AdminMobileNav links={ADMIN_NAV} />
            <span className="font-semibold">Адмінка</span>
          </div>
          <AdminLogoutButton />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
