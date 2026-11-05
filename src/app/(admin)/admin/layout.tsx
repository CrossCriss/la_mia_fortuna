import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

const ADMIN_NAV = [
  { href: "/admin", label: "Огляд" },
  { href: "/admin/products", label: "Товари" },
  { href: "/admin/import", label: "Імпорт" },
  { href: "/admin/categories", label: "Категорії" },
  { href: "/admin/orders", label: "Замовлення" },
  { href: "/admin/promocodes", label: "Промокоди" },
];

// Доступ до /admin/* захищено middleware.ts (перевірка сесійної cookie).
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <aside className="w-56 shrink-0 border-r border-neutral-200 bg-white p-4">
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
        <header className="flex items-center justify-end border-b border-neutral-200 bg-white px-6 py-3">
          <AdminLogoutButton />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
