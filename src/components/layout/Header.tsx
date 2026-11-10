import Link from "next/link";
import { CartTriggerButton } from "@/components/cart/CartTriggerButton";
import { MobileNav } from "@/components/layout/MobileNav";
import { NavDropdown } from "@/components/layout/NavDropdown";
import { SearchInput } from "@/components/layout/SearchInput";
import { prisma } from "@/lib/prisma";

// Верхній рівень меню — сезонні розділи (Зимове/Демісезонне/Літнє взуття,
// кожен зі своїми підкатегоріями типів) + Новинки/Розпродаж за флагами
// товару. Сезони тепер самі є верхнім рівнем каталогу, тож окремий пункт
// "сезонної колекції" з /admin/homepage в меню більше не дублюється.
async function getNavLinks() {
  const [seasons, flagCategories] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null, isVisible: true, kind: "REGULAR" },
      include: { children: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.category.findMany({
      where: { parentId: null, isVisible: true, kind: { in: ["NEW_ARRIVALS", "PROMO"] } },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return [
    ...seasons.map((season) => ({
      href: `/catalog/${season.slug}`,
      label: season.name,
      subcategories: season.children.map((child) => ({ slug: child.slug, name: child.name })),
    })),
    ...flagCategories.map((category) => ({
      href: `/catalog/${category.slug}`,
      label: category.name,
      subcategories: [] as { slug: string; name: string }[],
    })),
  ];
}

export async function Header() {
  const navLinks = await getNavLinks();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1 bg-surface-dark px-6 py-2.5 text-center text-xs font-semibold tracking-wide text-background">
        <span>Власне виробництво, Харків</span>
        <span>Натуральна шкіра</span>
        <span>Швидка відправка по Україні</span>
      </div>
      <div className="relative mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <MobileNav links={navLinks} />
          <Link href="/" className="flex flex-col leading-none">
            <span className="font-display text-[28px] font-semibold tracking-[0.2em] text-ink">
              FORTUNA
            </span>
            <span className="mt-1 text-[9px] tracking-[0.5em] text-ink-soft">LA MIA · SHOES</span>
          </Link>
        </div>

        <nav className="hidden gap-7 text-sm font-semibold md:flex">
          {navLinks.map((link) => (
            <NavDropdown
              key={link.href}
              href={link.href}
              label={link.label}
              subcategories={link.subcategories}
            />
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <SearchInput />
          <CartTriggerButton />
        </div>
      </div>
    </header>
  );
}
