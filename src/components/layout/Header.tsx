import Link from "next/link";
import { CartTriggerButton } from "@/components/cart/CartTriggerButton";
import { AccountNavButton } from "@/components/layout/AccountNavButton";
import { MobileNav } from "@/components/layout/MobileNav";
import { NavDropdown } from "@/components/layout/NavDropdown";
import { SearchInput } from "@/components/layout/SearchInput";
import { prisma } from "@/lib/prisma";

const NAV_LINKS = [
  { href: "/catalog/zhinoche-vzuttya", slug: "zhinoche-vzuttya", label: "Жіноче взуття" },
  { href: "/catalog/novynky", slug: "novynky", label: "Новинки" },
  // "Зима 2027" — назва поточної сезонної колекції, окремої категорії під неї
  // в БД немає, тож посилання веде на весь каталог взуття (рішення на час MVP).
  { href: "/catalog/zhinoche-vzuttya?collection=zima-2027", slug: "zhinoche-vzuttya", label: "Зима 2027" },
  { href: "/catalog/aktsii", slug: "aktsii", label: "Розпродаж" },
];

async function getSubcategoriesBySlug() {
  const categories = await prisma.category.findMany({
    where: { parentId: null, isVisible: true },
    include: { children: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });

  return new Map(
    categories.map((category) => [
      category.slug,
      category.children.map((child) => ({ slug: child.slug, name: child.name })),
    ])
  );
}

export async function Header() {
  const subcategoriesBySlug = await getSubcategoriesBySlug();
  const navLinks = NAV_LINKS.map((link) => ({
    ...link,
    subcategories: subcategoriesBySlug.get(link.slug) ?? [],
  }));

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
          <AccountNavButton />
          <CartTriggerButton />
        </div>
      </div>
    </header>
  );
}
