# E-commerce Starter Template

Каркас інтернет-магазину (спочатку витягнутий з проекту "Gola Pravda"). Каталог з категоріями/розмірами/кольорами і залишками по варіантах, кошик, чекаут без реєстрації (особистого кабінету клієнта в цьому проекті немає), адмінка для керування товарами/категоріями/замовленнями. UI — українською (легко перекласти, текст не зашитий у логіку).

**Це шаблон для нових клієнтських проектів.** Перед стартом нового магазину пройдіться по `SETUP-CHECKLIST.md` — там весь список того, що треба перейменувати/налаштувати під конкретного клієнта.

## Стек

- Next.js 14 (App Router, `src/app`)
- TypeScript, Tailwind CSS
- Prisma + PostgreSQL (Supabase)
- Zustand (кошик, client-side, persist у localStorage)
- Zod (валідація форм і API)
- Supabase Storage (фото товарів в адмінці)

## Команди

```bash
npm run dev              # локальний запуск (next dev)
npm run build             # production build
npm run typecheck         # tsc --noEmit

npm run prisma:migrate    # накатити міграції (prisma migrate dev)
npm run prisma:seed       # засіяти БД (категорії, розміри, кольори, демо-товари, admin-акаунт, відгуки)
npm run prisma:studio     # Prisma Studio
```

`.env` (скопіювати з `.env.example`) містить `DATABASE_URL`/`DIRECT_URL` (Supabase pooler/direct), `ADMIN_SESSION_SECRET`, `ADMIN_EMAIL`/`ADMIN_PASSWORD` (застосовуються тільки через `prisma:seed`), `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (фото).

**Важливо:** зміна `ADMIN_EMAIL`/`ADMIN_PASSWORD` у `.env` не діє сама по собі — потрібно повторно виконати `npm run prisma:seed`, щоб оновити хеш пароля в БД.

## Карта ключових папок

- `prisma/schema.prisma` — уся схема БД (Category, Product, ProductVariant, Size, Color, Order, AdminUser тощо; особистого кабінету клієнта немає)
- `prisma/seed.ts` — сідування (ідемпотентне, очищує й пересоздає довідники/демо-товари) — **тут демо-категорії/товари, які треба замінити реальними даними клієнта**
- `src/app/(public)/` — публічний сайт: `catalog/`, `catalog/[categorySlug]/`, `product/[productSlug]/`, `search/` (пошук за назвою товару + категорією), `cart/`, `checkout/`, `thank-you/`, статичні сторінки (about/delivery/returns/contacts/privacy)
- `src/app/(admin)/admin/` — адмінка (products/categories/orders/promocodes), захищена `src/middleware.ts`
- `src/app/(admin-auth)/admin/login/` — сторінка логіну, окрема route group, щоб не успадковувати layout адмінки
- `src/app/api/` — route handlers (публічні `products`/`categories`/`orders`, адмінські `api/admin/*`, `api/admin/upload` для фото)
- `src/components/catalog/` — `ProductCard`, `ProductGrid`, `CategoryGrid`, `CatalogFilters`
- `src/components/home/` — `Hero`, `FeaturedCategorySection` (секції-підбірки на головній за `Category.isFeaturedOnHome`), `UspBanner`, `FaqSection`
- `src/lib/home-badges.ts` — бейджі на картці товару лише для головної (Топ продажів/Новинка/Останні одиниці), окремо від `isNew`/`isPromo` каталогу
- `src/components/product/` — `ProductGallery`, `ProductOptions` (вибір розміру/кольору, врахування залишку)
- `src/components/cart/` — `CartDrawer`, `CartTriggerButton`
- `src/components/checkout/` — компоненти форми оформлення замовлення
- `src/components/admin/` — `ProductForm`, `CategoryForm`, `OrderStatusControl`, `DeleteButton`, `AdminLogoutButton`
- `src/lib/cart-store.ts` — Zustand-стор кошика (persist тільки `items`, `isOpen` — ні)
- `src/lib/format-price.ts` — єдина функція форматування ціни (без `Intl`, щоб уникнути hydration mismatch між сервером і клієнтом)
- `src/lib/admin-session.ts` — сесії адмінки (HMAC-cookie, Edge-safe); `src/lib/password.ts` — хешування пароля (Node-only, scrypt)
- `src/lib/catalog.ts` — побудова Prisma-фільтрів для категорій (включно з підкатегоріями, "Новинки"/"Акції" по флагах товару)

## Патерни, які варто зберегти при кастомізації

- **Оплата (`src/lib/payment/`)** — реальна інтеграція LiqPay й Monobank Acquiring, активний провайдер вибирається `PAYMENT_PROVIDER` в `.env` (`src/lib/payment/index.ts`). На чекауті клієнт бачить лише "Оплата карткою онлайн" / "Накладений платіж" (`ONLINE_CARD`/`CASH_ON_DELIVERY`) — яка саме платіжка це обробить, вирішує сервер в `POST /api/orders`, не клієнт. Вебхуки (`/api/payments/liqpay/callback`, `/api/payments/monobank/webhook`) самі підтягують `paymentStatus`; `OrderStatusControl` лишається як ручний override, якщо вебхук не дійшов. Без `MONOBANK_TOKEN`/`LIQPAY_PUBLIC_KEY`+`LIQPAY_PRIVATE_KEY` в `.env` оплата карткою впаде з 502 — підставляються в окремому кроці, коли клієнт дає реальні ключі.
- **Доставка (`src/lib/delivery/nova-poshta.ts`)** — автокомпліт міста/відділення на чекауті (`CityWarehouseFields`) через реальний Nova Poshta API; потребує `NOVA_POSHTA_API_KEY`. Розрахунок вартості доставки і генерація ТТН — свідомо поза межами MVP (ТТН адмін створює вручну в кабінеті Nova Poshta й вписує номер в `OrderStatusControl`).
- **GA4 / Meta Pixel** — підключати в останню чергу, коли сайт вже наповнений реальним контентом.
- Плейсхолдерний текст на сторінках about/delivery/returns/contacts/privacy — позначайте банером `PlaceholderNotice` і коментарем у коді, поки не отримали реальний контент від клієнта.
