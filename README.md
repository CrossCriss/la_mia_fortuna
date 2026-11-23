# La Mia Fortuna Shoes

Інтернет-магазин жіночого взуття La Mia Fortuna Shoes. Каталог з категоріями
(сезони і типи взуття), розмірами, кольорами і залишками по варіантах, кошик,
оформлення замовлення без реєстрації та адмінка для товарів, категорій і
замовлень.

Особистого кабінету покупця немає: замовлення оформлюються без реєстрації.
UI - українською.

## Що є в проєкті

- Каталог: категорії з підкатегоріями, розміри, кольори, залишки по варіантах, пошук і фільтри.
- Картка товару: галерея, вибір розміру й кольору з урахуванням залишку.
- Кошик (Zustand, збереження в localStorage) і чекаут без реєстрації.
- Оплата: накладений платіж. Оплата карткою через Monobank Acquiring або LiqPay
  вмикається прапорцем `NEXT_PUBLIC_ONLINE_PAYMENT_ENABLED`.
- Доставка: автокомпліт міст і відділень Нової Пошти.
- Сповіщення про нові замовлення і оплати в Telegram-групу (`src/lib/notify/`).
- Аналітика GA4 і Meta Pixel (`src/lib/analytics/`): скрипти вантажаться лише за наявності ID.
- Адмінка: товари з фото (Supabase Storage), категорії, замовлення.

## Стек

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Prisma + PostgreSQL (Supabase)
- Zustand, Zod
- Vitest для тестів
- Хостинг: Vercel

## Швидкий старт

```bash
npm install
cp .env.example .env     # заповнити значення, див. CREDENTIALS.md
npm run prisma:migrate   # лише локально: створює таблиці в dev-БД
npm run prisma:seed      # довідники і адмін-акаунт (ADMIN_EMAIL / ADMIN_PASSWORD)
npm run dev              # http://localhost:3000
```

У `.env` потрібні `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SITE_URL`,
`ADMIN_SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `NOVA_POSHTA_API_KEY`. Інші змінні (Monobank,
LiqPay, Telegram, GA4, Meta Pixel) опційні. `MONOBANK_TOKEN` потрібен, якщо
`NEXT_PUBLIC_ONLINE_PAYMENT_ENABLED` не `false` (у `.env.example` за замовчуванням
`"true"`). Повний список з коментарями - у `.env.example`.

## Команди

| Команда | Що робить |
| --- | --- |
| `npm run dev` | локальний запуск |
| `npm run build` | production-збірка |
| `npm run start` | запуск зібраного сайту |
| `npm run typecheck` | перевірка TypeScript |
| `npm run lint` | ESLint |
| `npm test` | тести (Vitest) |
| `npm run check:env` | перевірка змінних у `.env`; з `-- --prod` додаткові перевірки продакшену |
| `npm run smoke` | дымова перевірка сайту за адресою з `BASE_URL` (за замовчуванням `http://localhost:3000`) |
| `npm run prisma:generate` | генерація Prisma-клієнта |
| `npm run prisma:migrate` | міграції для розробки (`migrate dev`), не для продакшену |
| `npm run prisma:deploy` | застосування міграцій (`migrate deploy`), для продакшену |
| `npm run prisma:seed` | довідники і адмін-акаунт; сід тільки додає, нічого не видаляє |
| `npm run prisma:studio` | Prisma Studio |

## Структура

- `src/app/` - маршрути: `(public)` - сайт, `(admin)/admin` - адмінка,
  `(admin-auth)/admin/login` - логін адмінки, `api/` - route handlers
- `src/components/` - UI-компоненти (каталог, товар, кошик, чекаут, адмінка, аналітика)
- `src/lib/` - логіка: кошик, платежі (`payment/`), доставка (`delivery/`),
  сповіщення (`notify/`), аналітика (`analytics/`), rate limit (`rate-limit.ts`)
- `prisma/` - схема БД, міграції, сід (`seed.ts`)
- `scripts/` - `check-env.mjs` (перевірка змінних), `smoke.mjs` (дымова перевірка)
- `docs/` - документація проєкту

## Документація

- [`CLAUDE.md`](./CLAUDE.md) - стек, структура папок, архітектурні рішення
- [`docs/architecture.md`](./docs/architecture.md) - архітектура
- [`docs/tasks.md`](./docs/tasks.md) - задачі і їх статуси
- [`docs/admin-guide.md`](./docs/admin-guide.md) - інструкція для власниці магазину в адмінці
- [`docs/acceptance.md`](./docs/acceptance.md) - чек-лист ручної приймальної перевірки
- [`DEPLOY-CHECKLIST.md`](./DEPLOY-CHECKLIST.md) - запуск на бойовий сервер
- [`CREDENTIALS.md`](./CREDENTIALS.md) - де взяти ключі й ID для `.env`
- [`prisma/schema.prisma`](./prisma/schema.prisma) - схема БД
