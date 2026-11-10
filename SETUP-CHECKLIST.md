# Чекліст запуску нового магазину з цього шаблону

Кожен новий клієнт/інста-шоп — копія цього репо. Пройдіться зверху вниз.

## 1. Копіювання репо

```bash
cp -R ecommerce-starter-template new-client-site
cd new-client-site
rm -rf .git node_modules .next
git init
```

## 2. Інфраструктура (робити один раз на проект)

- [ ] Створити новий проект Supabase (Database + Storage + Auth не потрібен, тільки Postgres+Storage)
- [ ] Скопіювати `.env.example` → `.env`, заповнити `DATABASE_URL`/`DIRECT_URL` (Supabase → Project Settings → Database)
- [ ] Згенерувати `ADMIN_SESSION_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Вирішити `ADMIN_EMAIL`/`ADMIN_PASSWORD` (тимчасові, клієнт змінить пізніше через повторний seed)
- [ ] Supabase Storage: створити публічний bucket для фото товарів, вписати `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`
- [ ] `npm install`
- [ ] `npm run prisma:migrate` (створить таблиці за `prisma/schema.prisma`)
- [ ] `npm run prisma:seed`

## 3. Брендинг (пошук-заміна)

Шукайте `MyShop` по всьому репо (`grep -rli "myshop" src prisma package.json`) і замінюйте на реальну назву бренду:

- [ ] `src/app/layout.tsx` — `metadata.title`
- [ ] `src/components/layout/Header.tsx` — лого в шапці
- [ ] `src/components/layout/Footer.tsx` — лого, слоган, Instagram-посилання, copyright
- [ ] `src/app/(public)/about/page.tsx`, `contacts/page.tsx`, `privacy/page.tsx` — текст, email, Instagram
- [ ] `src/app/icon.svg` — фавікон (замінити монограму/колір або підставити реальний логотип)
- [ ] `package.json` → `"name"`
- [ ] `src/lib/cart-store.ts` → ключ localStorage `"shop-cart"` (не критично, але охайніше перейменувати)
- [ ] Кольори/шрифти бренду — `tailwind.config.ts` (`accent`, `ink`, `background` та шрифти Manrope/Unbounded у `src/app/layout.tsx`)

## 4. Контент і структура каталогу

- [ ] Продумати структуру категорій клієнта (з підкатегоріями чи без)
- [ ] Переписати `prisma/seed.ts`: замінити демо-категорії (`kategoriya-1`/`kategoriya-2` і підкатегорії) та демо-товари (`demo-product-*`) на реальні, або підготувати окремий скрипт імпорту з Excel/CRM (дивись готовий приклад підходу — Import Wizard — якщо клієнт дає прайс в Excel/CSV, варто написати обгортку навколо `xlsx`, яка мапить колонки на `Category`/`Product`/`ProductVariant`)
- [ ] Розмірна сітка (`Size`) і кольори (`Color`) — перевірити, чи підходить буквена сітка (XS-XXL), чи потрібна цифрова / без розмірів взагалі (тоді ProductVariant тримає лише stock без sizeId/colorId — треба зробити поля опціональними в схемі)
- [ ] Публічний хero-банер: додати `public/images/hero.jpg` і передати `image` в `<Hero />` на `src/app/(public)/page.tsx`
- [ ] Реальні фото товарів — через адмінку (upload у Supabase Storage) або масовим імпортом

## 5. Рішення, які варто підтвердити з клієнтом одразу (щоб не переробляти потім)

- [x] Особистий кабінет клієнта — вирішено: не потрібен, чекаут лише гостьовий (NextAuth, `User`/`Account`/`Session`/`SavedAddress` і накопичувальна знижка прибрані з проекту)
- [x] Способи оплати на чекауті — вирішено: оплата карткою онлайн (Monobank Acquiring, дешевший еквайринг; LiqPay лишається альтернативою через `PAYMENT_PROVIDER`) + накладений платіж
- [x] Спосіб доставки — вирішено: Nova Poshta, відділення обирається автокомплітом (реальний API, не текстове поле)
- [ ] Промокоди — потрібні з першого дня чи можна відкласти

## 6. Перед показом клієнту / деплоєм

- [ ] `npm run typecheck` — без помилок
- [ ] `npm run build` — проходить
- [ ] Прогнати вручну: каталог → фільтри → картка товару → додати в кошик → чекаут → "Дякуємо за замовлення" → перевірити замовлення в адмінці
- [ ] Прогнати мобільну версію (90%+ трафіку з Instagram зазвичай мобільний)
- [ ] Перевірити, що плейсхолдерний текст на about/delivery/returns/contacts/privacy позначений і не виглядає як фінальний контент
- [ ] Домен + хостинг (Vercel — найпростіше для Next.js) + env-змінні на проді

## Що свідомо лишити недороблено на MVP (типова послідовність для інста-шопу)

Ці інтеграції зазвичай не потрібні для першого запуску — підключайте окремими оплаченими завданнями, коли клієнт реально готовий. Для La Mia Fortuna клієнтка попросила оплату й доставку одразу, тож пункти 1-2 тут вже реалізовані (`src/lib/payment/`, `src/lib/delivery/nova-poshta.ts`) — лишається тільки підставити реальні ключі (`MONOBANK_TOKEN`/`LIQPAY_PUBLIC_KEY`+`LIQPAY_PRIVATE_KEY`, `NOVA_POSHTA_API_KEY`) в `.env`:

1. ~~Реальний виклик API платіжної системи~~ — зроблено, обирається `PAYMENT_PROVIDER` (LIQPAY/MONOBANK)
2. ~~Автокомпліт відділень Nova Poshta~~ — зроблено; розрахунок вартості доставки й генерація ТТН лишаються вручну (адмін створює ТТН у кабінеті НП)
3. GA4 / Meta Pixel — підключати, коли є трафік і що аналізувати
4. Telegram/email-сповіщення про нове замовлення — легко додати пізніше, не блокер для запуску
