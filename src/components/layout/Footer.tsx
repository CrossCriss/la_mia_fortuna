import Link from "next/link";
import { SITE } from "@/lib/site-config";

export async function Footer() {
  // "Магазин" — Новинки/Розпродаж за флагами товару; сезонні розділи
  // (Зимове/Демісезонне/Літнє взуття) тепер самі верхній рівень каталогу і
  // вже є в хедері, тож тут їх не дублюємо.
  const footerColumns = [
    {
      title: "Магазин",
      links: [
        { href: "/catalog/novynky", label: "Новинки" },
        { href: "/catalog/aktsii", label: "Розпродаж" },
      ],
    },
    {
      title: "Покупцям",
      links: [
        { href: "/delivery", label: "Умови замовлення" },
        { href: "/returns", label: "Повернення/обмін" },
        { href: "/size-guide", label: "Розмірна сітка" },
        { href: "/about", label: "Про нас" },
      ],
    },
    {
      title: "Контакти",
      links: [
        { href: SITE.phoneHref, label: `Viber, Telegram: ${SITE.phoneDisplay}` },
        { href: SITE.instagramUrl, label: `Instagram: ${SITE.instagramHandle}` },
      ],
    },
  ];

  return (
    <footer className="bg-ink text-background/70">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <div className="font-display text-2xl font-semibold tracking-[0.2em] text-background">
            FORTUNA
          </div>
          <p className="mt-3 max-w-[260px] text-sm leading-relaxed">
            Жіноче взуття з любов&apos;ю. Власне виробництво, натуральна шкіра, 15 років досвіду.
          </p>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <p className="mb-3 text-sm font-bold text-background">{column.title}</p>
            <nav className="flex flex-col gap-2">
              {column.links.map((link) => {
                const isExternal = link.href.startsWith("http");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className="text-sm transition hover:text-background"
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs">
        &copy; {new Date().getFullYear()} {SITE.name}. Офіційний ФОП
      </div>
    </footer>
  );
}
