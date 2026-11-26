// Єдине місце з даними сайту: бренд, контакти, соцмережі, реквізити продавця.
// Змінюючи тут значення, оновлюються футер, плаваючі кнопки, Instagram-блок,
// сторінка контактів і політика конфіденційності.

export const SITE = {
  name: "La Mia Fortuna Shoes",
  description: "Жіноче взуття з натуральної шкіри. Власне виробництво, Харків, 15 років досвіду.",
  phoneDisplay: "066 790 10 44",
  phoneHref: "tel:+380667901044",
  viberUrl: "viber://chat?number=%2B380667901044",
  telegramUrl: "https://t.me/+380667901044",
  instagramUrl: "https://www.instagram.com/la_mia_fortuna_shoes",
  instagramHandle: "@la_mia_fortuna_shoes",
  // Реквізити продавця (ФОП клієнтки).
  seller: {
    legalName: "ФОП Афанасьєва Оксана Анатоліївна",
    taxId: "2275621028",
    address: "м. Харків, в'їзд Енді Ворхола, 27",
    email: "lerafortuna1992@gmail.com",
  },
} as const;

// Базова адреса сайту без завершального слеша (для абсолютних посилань і метаданих).
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}
