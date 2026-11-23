# La Mia Fortuna Shoes

Інтернет-магазин жіночого взуття (Харків). Каталог з категоріями, розмірами, кольорами і залишками по варіантах, кошик, чекаут без реєстрації, адмінка для товарів, категорій і замовлень. UI українською.

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
npm test                  # тести (vitest)
npm run check:env        # перевірка змінних .env (з --prod - додаткові перевірки продакшену)
npm run smoke            # дымова перевірка розгорнутого сайту (адреса в BASE_URL)

npm run prisma:migrate    # накатити міграції (prisma migrate dev)
npm run prisma:deploy     # накатити міграції на прод (prisma migrate deploy)
npm run prisma:seed       # засіяти БД (категорії, сезони, розміри, кольори, адмін-акаунт, плейсхолдер-відгуки); тільки додає
npm run prisma:studio     # Prisma Studio
```

`.env` (скопіювати з `.env.example`) містить `DATABASE_URL`/`DIRECT_URL` (Supabase pooler/direct), `ADMIN_SESSION_SECRET`, `ADMIN_EMAIL`/`ADMIN_PASSWORD` (застосовуються тільки через `prisma:seed`), `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (фото).

**Важливо:** зміна `ADMIN_EMAIL`/`ADMIN_PASSWORD` у `.env` не діє сама по собі — потрібно повторно виконати `npm run prisma:seed`, щоб оновити хеш пароля в БД.

## Карта ключових папок

- `prisma/schema.prisma` — уся схема БД (Category, Product, ProductVariant, Size, Color, Order, AdminUser тощо; особистого кабінету клієнта немає)
- `prisma/seed.ts` - сідування: лише додає відсутнє (upsert), нічого не видаляє. Створює категорії (3 сезонні розділи з підкатегоріями, "Новинки", "Розпродаж"), розміри 36-41, 4 кольори, 3 плейсхолдер-відгуки, налаштування головної (якщо їх ще немає), адмін-акаунт (пароль оновлюється з `ADMIN_PASSWORD` при кожному сіді). Товарів не створює: асортимент вносить клієнтка в адмінці
- `src/app/(public)/` — публічний сайт: `catalog/`, `catalog/[categorySlug]/`, `product/[productSlug]/`, `search/` (пошук за назвою товару + категорією), `cart/`, `checkout/`, `thank-you/`, статичні сторінки (about/delivery/returns/contacts/privacy)
- `src/app/(admin)/admin/` - адмінка (products/categories/orders; promocodes - сторінка `/admin/promocodes` є в коді, прихована з меню), захищена `src/middleware.ts`
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

- **Оплата (`src/lib/payment/`)** - реальна інтеграція LiqPay й Monobank Acquiring, активний провайдер вибирається `PAYMENT_PROVIDER` в `.env` (`src/lib/payment/index.ts`). На чекауті клієнт бачить лише "Оплата карткою онлайн" / "Накладений платіж" (`ONLINE_CARD`/`CASH_ON_DELIVERY`) - яка саме платіжка це обробить, вирішує сервер в `POST /api/orders`, не клієнт. Вебхуки (`/api/payments/liqpay/callback`, `/api/payments/monobank/webhook`) самі підтягують `paymentStatus`; `OrderStatusControl` лишається як ручний override, якщо вебхук не дійшов. Без `MONOBANK_TOKEN`/`LIQPAY_PUBLIC_KEY`+`LIQPAY_PRIVATE_KEY` в `.env` оплата карткою впаде з 502 - підставляються в окремому кроці, коли клієнт дає реальні ключі. Прапорець `NEXT_PUBLIC_ONLINE_PAYMENT_ENABLED` (`src/lib/payment/index.ts`) ховає оплату карткою на чекауті; `"false"` означає лише накладений платіж. Значення вшивається при збірці, тому зміна потребує Redeploy.
- **Доставка (`src/lib/delivery/nova-poshta.ts`)** — автокомпліт міста/відділення на чекауті (`CityWarehouseFields`) через реальний Nova Poshta API; потребує `NOVA_POSHTA_API_KEY`. Розрахунок вартості доставки і генерація ТТН — свідомо поза межами MVP (ТТН адмін створює вручну в кабінеті Nova Poshta й вписує номер в `OrderStatusControl`).
- **Сповіщення (`src/lib/notify/telegram.ts`)** - нове замовлення і успішна оплата йдуть у Telegram-групу клієнтки через `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`. Без змінних сповіщення вимкнені, оформлення замовлення від цього не ламається.
- **Rate limit (`src/lib/rate-limit.ts`)** - лічильник у пам'яті одного екземпляра (на Vercel не спільний). Основний захист - правило Rate Limiting у Vercel Firewall для `/api/orders` і `/api/admin/login`.
- **GA4 / Meta Pixel (`src/lib/analytics/`, `src/components/analytics/`)** - реалізовано; скрипти вантажаться лише коли задано `NEXT_PUBLIC_GA4_ID` / `NEXT_PUBLIC_META_PIXEL_ID`. Підключати в останню чергу, коли сайт вже наповнений реальним контентом.
- Плейсхолдерний текст на сторінках about/delivery/returns/contacts/privacy — позначайте банером `PlaceholderNotice` і коментарем у коді, поки не отримали реальний контент від клієнта.

# Рабочий процесс
Ты оркестратор. Сам код реализации не пишешь, только координируешь.
1. Новый проект или крупная фича: вызови subagent architect.
2. Каждую задачу из docs/tasks.md отдавай исполнителю: implementer для логики, implementer-lite для простого. Независимые задачи запускай параллельно.
3. После каждой задачи вызывай reviewer.
4. При FAIL возвращай правки исполнителю, максимум 2 круга. Если не помогло, разбери причину сам и скажи мне.
5. Задача закрыта только после PASS и зеленых тестов. Отмечай статус в docs/tasks.md.
6. Не пиши длинные тире в текстах и коде.
