# Задачи: подготовка La Mia Fortuna Shoes к запуску

Обоснование решений: `docs/architecture.md`. Статусы ведет оркестратор: `TODO`, `IN PROGRESS`, `DONE`, `BLOCKED`.

## Правила для исполнителей (читать перед любой задачей)

1. Меняй только файлы из списка задачи. Нужен другой файл - остановись и сообщи.
2. БД. Запрещено без подтверждения владельца: `prisma migrate reset`, `prisma db push`, `deleteMany`, `DROP`, `TRUNCATE`, одноразовые скрипты, меняющие данные, любые команды против production-БД. `prisma/seed.ts` только добавляет, удалений в нем быть не должно. Если `prisma migrate dev` предлагает сброс или пишет о потере данных, остановись.
3. Тексты интерфейса на украинском. Длинные тире не использовать нигде (ни в коде, ни в текстах), только дефис.
4. Админка должна оставаться максимально простой: никаких технических полей и терминов для клиентки.
5. Секреты не коммитить, значения ключей в отчеты не писать. Коммиты делает оркестратор.
6. Проверки. `БАЗА` = `npm run typecheck && npm run lint && npm test` (до выполнения F-01 команды `npm test` нет, тогда `npm run typecheck && npm run lint`). `npm run lint` должен завершаться без ошибок (предупреждения допустимы, если задача не говорит иначе).
7. `npm run build` запускать, только если он есть в критериях. Не запускать при работающем dev-сервере; после сборки выполнить `rm -rf .next`. Если сборка упала внутри `next/font` (Google Fonts), повторить один раз.
8. Ошибки связи с Supabase (`Can't reach database server`, `fetch failed`) в этой среде случаются сами по себе: повторить через несколько секунд, не чинить код.
9. Тесты лежат рядом с кодом: `src/**/*.test.ts`, импорт `describe/it/expect/vi` из `vitest`. Тесты не ходят в сеть и в БД.
10. Задачи, которые трогают один и тот же файл, не выполняются одновременно: порядок задан зависимостями.

## Решения владельца (утверждены 2026-11-12, имеют приоритет над текстом задач)

1. Уведомления о заказах (O-06) идут в **отдельную Telegram-группу** клиентки, не в личный чат. `TELEGRAM_CHAT_ID` - идентификатор группы (отрицательное число); бота нужно добавить в группу. В `CREDENTIALS.md` (D-02) описать именно это.
2. Промокоды к запуску не нужны: пункт меню скрыть, `POST` удалить (F-06).
3. Импорт из Excel пока не нужен: пункт "Імпорт" убрать из меню (F-06 выполняет это, подтверждено владельцем).
4. Реклама только на Украину: баннер согласия на cookie и Conversions API не делаем.
5. Запуск сначала только с наложенным платежом: на Production `NEXT_PUBLIC_ONLINE_PAYMENT_ENABLED=false` (O-08). Оплату картой включаем после получения боевого токена Monobank от клиентки.
6. Публичную оферту и политику конфиденциальности готовим мы (клиентка не умеет, юриста нет). C-02 дает каркас, C-04 заполняет черновики полноценными текстами по украинскому законодательству (закон об электронной коммерции, о защите прав потребителей, о защите персональных данных) по реквизитам ФОП клиентки. Это шаблонные черновики, не юридическая консультация: в отчете об этом сказать явно, рекомендовать владельцу разовую проверку юристом.
7. Supabase: у владельца уже есть платный тариф, прод-проект создается там. Vercel: платный тариф оформляется, когда клиентка оплатит, до этого деплой на прод откладывается (локальная работа и все задачи кода не блокируются).
8. Гайд по админке пишем (D-01).

Пометка "Параллельная" означает: зависимостей нет, можно запускать сразу и одновременно с другими параллельными.

## Сводка

| Этап | Задачи | Количество |
| --- | --- | --- |
| 1. Фундамент и подготовка к деплою | F-01 - F-06 | 6 |
| 2. Заказ, оплата, уведомления | O-01 - O-08 | 8 |
| 3. Контент и юридическое (код) | C-01 - C-05 | 5 |
| 4. SEO, Open Graph, ссылки | S-01 - S-05 | 5 |
| 5. Аналитика и реклама | A-01 - A-07 | 7 |
| 6. Скорость на мобильном | P-01 - P-03 | 3 |
| 7. Документация, тесты, приемка | D-01, D-02, Q-01 - Q-03 | 5 |
| Всего | | 39 |

Параллельные (без зависимостей): F-01, F-02, F-03, F-06, C-03, S-05.

Цепочки по общим файлам (для оркестратора):

- `package.json`: F-01 -> F-04 -> Q-01
- `src/app/api/orders/route.ts`: O-02 -> O-06 -> O-07 -> O-08 -> A-06
- `src/app/(public)/checkout/page.tsx`: C-02 -> O-08 -> A-03 -> A-06
- `src/app/(public)/product/[productSlug]/page.tsx`: C-01 -> S-02 -> A-03 -> P-03
- `src/app/(public)/thank-you/page.tsx`: O-05 -> A-04
- `src/app/(public)/layout.tsx`: A-02 -> A-05
- `src/app/(public)/page.tsx`: C-03 -> P-02 -> P-03
- `src/components/catalog/ProductCard.tsx`: A-03 -> P-02
- `src/lib/payment/monobank.ts`: O-03 -> O-04 -> O-05
- `src/lib/payment/apply-webhook.ts`: O-03 -> O-06
- `src/lib/checkout-schema.ts`: O-02 -> A-06
- `src/lib/notify/telegram.ts`: O-06 -> A-07
- `src/components/layout/Footer.tsx`, `contacts/page.tsx`: F-02 -> C-02 -> S-03

---

## Этап 1. Фундамент и подготовка к деплою

### F-01. Скрипты package.json и тестовый раннер Vitest

- Статус: DONE
- Цель: сборка на Vercel получает Prisma-клиент, есть безопасная команда миграций для прода и команда `npm test`.
- Файлы: `package.json`, `package-lock.json`, `vitest.config.ts` (новый), `src/lib/format-price.test.ts` (новый).
- Входы и выходы:
  - В `scripts` добавить: `"postinstall": "prisma generate"`, `"prisma:deploy": "prisma migrate deploy"`, `"test": "vitest run"`, `"test:watch": "vitest"`.
  - Установить `vitest` в devDependencies (`npm install -D vitest`). Других пакетов не добавлять.
  - `vitest.config.ts`: `environment: "node"`, `include: ["src/**/*.test.ts"]`, alias `@` -> `./src`.
  - `src/lib/format-price.test.ts`: 4-5 тестов на `formatPrice` (целое число, разделитель тысяч, копейки через запятую, строка на входе).
- Критерии приемки:
  - `npm test` завершается с кодом 0, тесты из `format-price.test.ts` зеленые.
  - `npm run typecheck && npm run lint` без ошибок.
  - `node -e "const s=require('./package.json').scripts; if(s.postinstall!=='prisma generate'||s['prisma:deploy']!=='prisma migrate deploy') process.exit(1)"` завершается с кодом 0.
- Модель: haiku
- Зависимости: нет. Параллельная.

### F-02. Единый конфиг сайта (контакты, бренд, реквизиты)

- Статус: DONE
- Цель: телефон, ссылки на соцсети, название бренда и реквизиты продавца лежат в одном файле, а не в пяти.
- Файлы: `src/lib/site-config.ts` (новый), `src/components/layout/Footer.tsx`, `src/components/home/ContactFloatingBar.tsx`, `src/components/home/InstagramTeaser.tsx`, `src/app/(public)/contacts/page.tsx`, `src/app/(public)/privacy/page.tsx`.
- Входы и выходы:
  - `site-config.ts` экспортирует `SITE` (объект `as const`): `name: "La Mia Fortuna Shoes"`, `description` (текущий из `src/app/layout.tsx`), `phoneDisplay: "066 790 10 44"`, `phoneHref: "tel:+380667901044"`, `telegramUrl: "https://t.me/+380667901044"`, `instagramUrl: "https://www.instagram.com/la_mia_fortuna_shoes"`, `instagramHandle: "@la_mia_fortuna_shoes"`, `seller: { legalName: "", taxId: "", address: "", email: "" }` (пустые строки, заполнит человек).
  - Там же функция `getSiteUrl(): string`: возвращает `process.env.NEXT_PUBLIC_SITE_URL` без завершающего слеша, по умолчанию `http://localhost:3000`.
  - В перечисленных компонентах заменить зашитые телефон и ссылки на значения из `SITE`. Внешний вид и тексты не менять.
- Критерии приемки:
  - `grep -rn "667901044\|instagram.com/la_mia" src --include=*.tsx --include=*.ts | grep -v site-config` ничего не выводит.
  - `npm run typecheck && npm run lint` без ошибок.
- Модель: haiku
- Зависимости: нет. Параллельная.

### F-03. next.config: заголовки безопасности, хосты картинок, регион Vercel

- Статус: DONE
- Цель: базовые заголовки безопасности, оптимизатор картинок не работает как открытый прокси, функции Vercel рядом с БД.
- Файлы: `next.config.mjs`, `vercel.json` (новый).
- Входы и выходы:
  - `images.remotePatterns`: вместо `hostname: "**"` оставить один шаблон `{ protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" }`. Добавить `images.minimumCacheTTL: 2678400`.
  - `async headers()` для `source: "/(.*)"`: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. Content-Security-Policy не добавлять.
  - `vercel.json`: `{ "regions": ["fra1"] }`.
- Критерии приемки:
  - `npm run typecheck && npm run lint` без ошибок, `npm run build` проходит.
  - `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8'))"` без ошибки.
  - При запущенном сервере `curl -sI http://localhost:3000/ | grep -i "x-content-type-options"` выводит `nosniff`.
- Модель: haiku
- Зависимости: нет. Параллельная.

### F-04. Полный .env.example и скрипт проверки окружения

- Статус: DONE
- Цель: перед деплоем одной командой видно, каких переменных не хватает и где остались заглушки.
- Файлы: `.env.example`, `scripts/check-env.mjs` (новый), `package.json`.
- Входы и выходы:
  - `.env.example`: добавить (с комментариями на украинском) `NEXT_PUBLIC_ONLINE_PAYMENT_ENABLED="true"`, `LIQPAY_SANDBOX=`, `TELEGRAM_BOT_TOKEN=`, `TELEGRAM_CHAT_ID=`, раскомментировать `NEXT_PUBLIC_GA4_ID=` и `NEXT_PUBLIC_META_PIXEL_ID=` (пустые). К `DATABASE_URL` дописать в комментарии, что для Vercel в конец добавляется `&connection_limit=1`.
  - `scripts/check-env.mjs` (без зависимостей, читает `process.env`). Обязательные: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_SESSION_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NOVA_POSHTA_API_KEY`. Предупреждения (не ошибка): пустые `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`, `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID`; пустой `MONOBANK_TOKEN` при `NEXT_PUBLIC_ONLINE_PAYMENT_ENABLED` не равном `"false"` - ошибка.
  - Флаг `--prod` добавляет проверки: `NEXT_PUBLIC_SITE_URL` начинается с `https://` и не содержит `localhost`; `ADMIN_SESSION_SECRET` не короче 32 символов и не содержит слова `сгенерируйте`; `DATABASE_URL` содержит `pgbouncer=true`.
  - Скрипт печатает список проблем (значения переменных не печатать) и выходит с кодом 1 при ошибках, 0 иначе.
  - `package.json`: `"check:env": "node --env-file=.env scripts/check-env.mjs"`.
- Критерии приемки:
  - `env -i PATH="$PATH" node scripts/check-env.mjs; echo $?` печатает список недостающих переменных и `1`.
  - `npm run check:env` на локальном `.env` отрабатывает без падения самого скрипта (код 0 или 1 с понятным списком).
  - `БАЗА` зеленая.
- Модель: haiku
- Зависимости: F-01.

### F-05. CI в GitHub Actions

- Статус: DONE
- Цель: на каждый push и pull request автоматически идут typecheck, lint и тесты.
- Файлы: `.github/workflows/ci.yml` (новый).
- Входы и выходы: один job на `ubuntu-latest`, Node 20, шаги: `actions/checkout@v4`, `actions/setup-node@v4` с кэшем npm, `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`. Секреты и БД не нужны. Сборку (`npm run build`) в CI не добавлять.
- Критерии приемки:
  - `БАЗА` зеленая локально.
  - После push (делает оркестратор) `gh run list --limit 1` показывает успешный запуск workflow `ci`.
- Модель: haiku
- Зависимости: F-01.

### F-06. Мелкое укрепление админки

- Статус: DONE
- Цель: убрать небезопасные и сбивающие клиентку места в админке.
- Файлы: `src/app/api/admin/upload/route.ts`, `src/app/api/admin/promocodes/route.ts`, `src/app/(admin)/admin/layout.tsx`.
- Входы и выходы:
  - Upload: принимать только `image/jpeg`, `image/png`, `image/webp` (иначе 400 с текстом "Підтримуються фото у форматі JPG, PNG або WebP"). Расширение файла брать из MIME-типа (`jpg`/`png`/`webp`), а не из имени файла.
  - Promocodes: удалить обработчик `POST` (он пишет в БД непроверенное тело запроса). `GET` оставить.
  - Меню админки: убрать пункт "Промокоди" из массива ссылок в `layout.tsx` (страница остается доступной по прямому адресу). Пункт "Імпорт" тоже убрать из массива ссылок (владелец подтвердил 2026-11-12, импорт пока не нужен; страница остается доступной по прямому адресу). Дополнительная проверка: `grep -n "Імпорт" "src/app/(admin)/admin/layout.tsx"` ничего не выводит.
- Критерии приемки:
  - `grep -n "export async function POST" src/app/api/admin/promocodes/route.ts` ничего не выводит.
  - `grep -n "Промокоди" "src/app/(admin)/admin/layout.tsx"` ничего не выводит.
  - `grep -n "file.name" src/app/api/admin/upload/route.ts` ничего не выводит.
  - `npm run typecheck && npm run lint` без ошибок.
- Модель: haiku
- Зависимости: нет. Параллельная.

---

## Этап 2. Заказ, оплата, уведомления

### O-01. Чистая логика заказа с тестами

- Статус: DONE
- Цель: расчет позиций заказа и номер заказа вынесены из роута в тестируемые функции.
- Файлы: `src/lib/orders/build-order.ts` (новый), `src/lib/orders/build-order.test.ts` (новый).
- Входы и выходы:
  - `export const MAX_QUANTITY_PER_ITEM = 10`.
  - `buildOrderItems(items, variants)`. `items`: `{ variantId: string; quantity: number }[]`. `variants`: массив объектов `{ id; stock: number; sku: string | null; size: { value: string }; color: { name: string }; product: { id; name; sku; isPublished: boolean; price: number | string | { toString(): string }; discountPrice: то же или null } }` (совместимо с результатом Prisma, цену приводить через `Number(String(x))`).
  - Результат: `{ ok: true; orderItems: {...}[]; subtotal: number }` или `{ ok: false; unavailableVariantIds: string[] }`.
  - Правила: одинаковые `variantId` во входе складываются; позиция недоступна, если варианта нет в `variants`, либо `product.isPublished === false`, либо `stock <= 0`; количество с остатком не сравнивать (`stock` это флаг наличия 1/0) и остаток не уменьшать; цена = `discountPrice ?? price`; `total` позиции и `subtotal` округляются до копеек (`Math.round(x * 100) / 100`).
  - Поля `orderItems`: `productId, variantId, productName, sku (variant.sku ?? product.sku), size, color, price, quantity, total` (как сейчас в `src/app/api/orders/route.ts`).
  - `generateOrderNumber(now: Date, random: () => number = Math.random): string` -> `LMF-YYMMDD-XXXX`, где `XXXX` это 4 символа из алфавита `ABCDEFGHJKMNPQRSTUVWXYZ23456789`.
- Критерии приемки:
  - `npm test` зеленый; тесты покрывают: обычный заказ, скидочную цену, склейку дублей, скрытый товар, `stock = 0`, отсутствующий вариант, округление (например 3 x 1999.99), формат номера заказа по регулярному выражению.
  - `БАЗА` зеленая.
- Модель: sonnet
- Зависимости: F-01.

### O-02. Подключить логику заказа к POST /api/orders

- Статус: DONE
- Цель: заказ нельзя создать на скрытый или отсутствующий товар, плохой запрос не роняет роут, номер заказа в новом формате.
- Файлы: `src/app/api/orders/route.ts`, `src/lib/checkout-schema.ts`, `src/lib/checkout-schema.test.ts` (новый).
- Входы и выходы:
  - `request.json()` обернуть: при невалидном JSON ответ 400 `{ error: "Некоректні дані замовлення" }`.
  - В `createOrderSchema`: `quantity` максимум `MAX_QUANTITY_PER_ITEM`, массив `items` максимум 30 позиций.
  - Использовать `buildOrderItems`. При `ok: false` ответ 409 `{ error: "Деякі товари з кошика вже недоступні. Оновіть кошик і спробуйте ще раз.", unavailableVariantIds }`.
  - `orderNumber` через `generateOrderNumber(new Date())`; при ошибке Prisma `P2002` (номер занят) повторить создание до 3 раз с новым номером.
  - Остальное поведение (выбор провайдера, создание счета, ответ 201/502) не менять.
  - Тесты схемы: валидные телефоны (`0501234567`, `+380501234567`, `380501234567`), невалидный телефон, пустой `items`, количество 0 и 11, оба значения `paymentMethod`.
- Критерии приемки:
  - `БАЗА` зеленая.
  - `grep -n "GP-" src/app/api/orders/route.ts` ничего не выводит.
  - При запущенном сервере: `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/orders -H "Content-Type: application/json" -d "not json"` печатает `400`.
- Модель: sonnet
- Зависимости: O-01.

### O-03. Правильные переходы статуса оплаты

- Статус: DONE
- Цель: промежуточные и запоздавшие вебхуки не портят статус, оплата засчитывается только при совпадении суммы и счета.
- Файлы: `src/lib/payment/types.ts`, `src/lib/payment/resolve-payment-update.ts` (новый), `src/lib/payment/resolve-payment-update.test.ts` (новый), `src/lib/payment/apply-webhook.ts`, `src/lib/payment/monobank.ts`, `src/lib/payment/liqpay.ts`.
- Входы и выходы:
  - `types.ts`: в `PaymentWebhookResult` заменить `isPaid: boolean` на `status: "PAID" | "FAILED" | "REFUNDED" | "PENDING"` и добавить `amount: number | null` (в гривнах).
  - Monobank (`parseMonobankWebhook`): `success` -> `PAID`; `failure`, `expired` -> `FAILED`; `reversed` -> `REFUNDED`; остальные -> `PENDING`. `amount` = `payload.amount / 100`, если поле число, иначе `null`.
  - LiqPay (`parseLiqpayCallback`): `success` -> `PAID`; `sandbox` -> `PAID` только при `process.env.LIQPAY_SANDBOX === "1"`, иначе `PENDING`; `failure`, `error` -> `FAILED`; `reversed` -> `REFUNDED`; остальные -> `PENDING`. `amount` = `Number(payload.amount)` или `null`.
  - `resolvePaymentUpdate(order, result)`, где `order = { status, paymentStatus, total: number, paymentProviderInvoiceId: string | null }`. Возвращает `{ kind: "update"; paymentStatus; status; becamePaid: boolean }` или `{ kind: "ignore"; reason: string }`. Правила по порядку:
    1. `result.status === "PENDING"` -> ignore.
    2. `order.paymentStatus === "REFUNDED"` -> ignore.
    3. У заказа есть `paymentProviderInvoiceId`, и он не равен `result.invoiceId` -> ignore (`invoice_mismatch`).
    4. `order.paymentStatus === "PAID"`: только `REFUNDED` дает update (статус заказа не меняется), остальное ignore.
    5. `result.status === "PAID"`: если `amount !== null` и сумма в копейках не равна сумме заказа в копейках -> ignore (`amount_mismatch`); иначе update: `paymentStatus: "PAID"`, `status` меняется `NEW` -> `CONFIRMED` (другие статусы заказа не трогать), `becamePaid: true`.
    6. `FAILED` или `REFUNDED` при `PENDING`/`FAILED` -> update `paymentStatus`, статус заказа не менять, `becamePaid: false`.
  - `applyPaymentWebhook(result)`: найти заказ по `orderNumber`; не найден -> `console.error` и вернуть `null`; вызвать `resolvePaymentUpdate`; при ignore -> `console.warn` с причиной, вернуть `null`; при update выполнить `prisma.order.updateMany({ where: { id, paymentStatus: <прежний> }, data: { paymentStatus, status, paymentProviderInvoiceId: result.invoiceId, paymentProviderPayload } })` и вернуть `{ orderId, becamePaid }`, только если `count === 1`, иначе `null`.
  - Роуты вебхуков не менять (они вызывают те же функции).
- Критерии приемки:
  - `npm test` зеленый; тесты `resolvePaymentUpdate` покрывают все шесть правил, включая: `processing` после `PAID` не меняет статус; `success` с неверной суммой игнорируется; заказ в статусе `SHIPPED` остается `SHIPPED` при оплате.
  - `grep -rn "isPaid" src` ничего не выводит.
  - `БАЗА` зеленая.
- Модель: sonnet
- Зависимости: F-01.

### O-04. Тесты подписи вебхуков, сравнение подписи LiqPay

- Статус: DONE
- Цель: проверка подписи платежных вебхуков закреплена тестами.
- Файлы: `src/lib/payment/liqpay.ts`, `src/lib/payment/monobank.ts`, `src/lib/payment/liqpay.test.ts` (новый), `src/lib/payment/monobank.test.ts` (новый).
- Входы и выходы:
  - LiqPay: сравнение подписи через `timingSafeEqual` (при разной длине сразу отказ).
  - Monobank: при необходимости экспортировать функцию сброса кэша ключа только для тестов (`__resetMonobankKeyCacheForTests`). Логику проверки не менять.
  - Тесты LiqPay: задать ключи через `process.env`, собрать `data` и подпись по формуле `base64(sha1(private + data + private))`; верная подпись разбирается, неверная бросает ошибку; маппинг статусов, включая `sandbox` с флагом и без.
  - Тесты Monobank: сгенерировать пару ключей `generateKeyPairSync("ec", { namedCurve: "prime256v1" })`, публичный ключ отдать через `vi.stubGlobal("fetch", ...)` в формате ответа `/pubkey` (`{ key: <base64 DER SPKI> }`), подписать тело `crypto.sign("SHA256", body, privateKey)`; верная подпись проходит, измененное тело отклоняется, при смене ключа происходит повторный запрос ключа; маппинг статусов и суммы.
- Критерии приемки:
  - `npm test` зеленый, в выводе есть оба файла тестов, сеть не используется.
  - `БАЗА` зеленая.
- Модель: sonnet
- Зависимости: O-03.

### O-05. Страница благодарности с реальным статусом и сверкой оплаты

- Статус: DONE
- Цель: покупатель видит состояние заказа, пропущенный вебхук Monobank догоняется при открытии страницы, есть данные для события покупки.
- Файлы: `src/lib/payment/monobank.ts`, `src/lib/orders/public-order.ts` (новый), `src/app/(public)/thank-you/page.tsx`.
- Входы и выходы:
  - `monobank.ts`: `getMonobankInvoiceStatus(invoiceId): Promise<PaymentWebhookResult>` - `GET {MONOBANK_API_URL}/invoice/status?invoiceId=...` с заголовком `X-Token`, `cache: "no-store"`, таймаут 4 секунды (`AbortSignal.timeout`). Маппинг статусов и суммы тот же, что в `parseMonobankWebhook` (вынести в общую функцию внутри файла). `orderNumber` = поле `reference` ответа.
  - `public-order.ts`: `getPublicOrderSummary(orderNumber: string)`. Возвращает `null`, если заказа нет или он старше 30 дней. Иначе `{ orderNumber, paymentKind: "CARD" | "COD", paymentStatus, total: number, trackingNumber: string | null, items: { id: string; name: string; price: number; quantity: number }[] }`, где `items[].id` = slug товара (через связь `OrderItem.product`), а если товар удален, то `productId ?? sku`. Персональные данные (имя, телефон, email, адрес) в результат не включать.
  - Если заказ `MONOBANK`, `paymentStatus === "PENDING"` и есть `paymentProviderInvoiceId`: вызвать `getMonobankInvoiceStatus`, передать результат в `applyPaymentWebhook`, перечитать заказ. Любая ошибка сверки глотается (`console.error`), страница все равно рендерится.
  - `thank-you/page.tsx`: серверный компонент, `export const dynamic = "force-dynamic"`. Тексты: наложенный платеж - "Замовлення прийнято, ми зв'яжемось з вами для підтвердження"; карта `PAID` - "Оплату отримано"; карта `PENDING` - "Очікуємо підтвердження оплати. Якщо ви вже оплатили, статус оновиться за кілька хвилин"; карта `FAILED` - "Оплата не пройшла. Напишіть нам, і ми допоможемо завершити замовлення" плюс ссылки на Telegram и телефон из `SITE`. Показывать состав и сумму (`formatPrice`), ТТН если есть. Если сводки нет (`null`) - прежний общий текст с номером из URL.
- Критерии приемки:
  - `БАЗА` зеленая, `npm run build` проходит.
  - При запущенном сервере `curl -s "http://localhost:3000/thank-you?order=LMF-000000-XXXX" | grep -c "Дякуємо"` печатает число больше 0 (несуществующий заказ не дает ошибку 500).
  - `grep -n "customerName\|phone\|email" src/lib/orders/public-order.ts` ничего не выводит.
- Модель: sonnet
- Зависимости: O-04.

### O-06. Уведомления о заказах в Telegram

- Статус: DONE
- Цель: клиентка получает сообщение о каждом новом заказе и об успешной оплате.
- Файлы: `src/lib/notify/telegram.ts` (новый), `src/lib/notify/telegram.test.ts` (новый), `src/app/api/orders/route.ts`, `src/lib/payment/apply-webhook.ts`.
- Входы и выходы:
  - `formatNewOrderMessage(order, adminUrl): string` - чистая функция, обычный текст без разметки: номер заказа, имя, телефон, город и отделение, позиции (название, размер, цвет, количество, цена), сумма, способ оплаты ("Накладений платіж" или "Карткою онлайн, очікує оплату"), комментарий, ссылка `adminUrl`.
  - `formatPaidMessage(orderNumber, total): string`.
  - `sendTelegramMessage(text): Promise<void>`: если нет `TELEGRAM_BOT_TOKEN` или `TELEGRAM_CHAT_ID` - `console.warn` один раз и выход; иначе `POST https://api.telegram.org/bot<token>/sendMessage` с `{ chat_id, text, disable_web_page_preview: true }`, таймаут 3 секунды. Никогда не бросает исключение (все ошибки в `console.error`).
  - `orders/route.ts`: после создания заказа `await sendTelegramMessage(formatNewOrderMessage(order, getSiteUrl() + "/admin/orders/" + order.id))` (await обязателен: на serverless незавершенный запрос обрывается). Ошибка уведомления не влияет на ответ.
  - `apply-webhook.ts`: если обновление прошло и `becamePaid === true`, отправить `formatPaidMessage`.
- Критерии приемки:
  - `npm test` зеленый: тесты форматирования (все поля на месте, нет `undefined`/`null` в тексте при пустом комментарии и email) и тест, что `sendTelegramMessage` без переменных окружения не вызывает `fetch` и не бросает.
  - `БАЗА` зеленая.
- Модель: sonnet
- Зависимости: O-02, O-03, F-02.

### O-07. Ограничение частоты запросов

- Статус: DONE
- Цель: затруднить перебор пароля админки и спам заказами.
- Файлы: `src/lib/rate-limit.ts` (новый), `src/lib/rate-limit.test.ts` (новый), `src/app/api/admin/login/route.ts`, `src/app/api/orders/route.ts`, `src/app/api/delivery/nova-poshta/cities/route.ts`, `src/app/api/delivery/nova-poshta/warehouses/route.ts`.
- Входы и выходы:
  - `rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): { allowed: boolean; retryAfterSeconds: number }` - счетчик в `Map` в памяти процесса, фиксированное окно, очистка просроченных записей при обращении. `getClientIp(request): string` - первое значение `x-forwarded-for`, иначе `"unknown"`.
  - Логин: 5 попыток за 15 минут на ключ `login:<ip>`; при превышении 429 `{ error: "Забагато спроб. Спробуйте через 15 хвилин." }`.
  - Заказы: 10 за 10 минут на `order:<ip>`; 429 `{ error: "Забагато запитів. Спробуйте трохи пізніше." }`.
  - Новая Почта (оба роута): 60 в минуту на `np:<ip>`; 429. В этих двух роутах при ошибке отдавать общий текст "Не вдалося отримати дані Нової Пошти" вместо `error.message` (сам текст ошибки писать в `console.error`).
  - В комментарии к модулю указать ограничение: счетчик живет в одном экземпляре функции, основная защита - правило в Vercel Firewall.
- Критерии приемки:
  - `npm test` зеленый: лимит срабатывает на N+1 запросе, окно сбрасывается по времени (через параметр `now`), разные ключи независимы.
  - При запущенном сервере шестой подряд `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/admin/login -H "Content-Type: application/json" -d '{"email":"x@x.x","password":"x"}'` печатает `429`.
  - `БАЗА` зеленая.
- Модель: sonnet
- Зависимости: O-06.

### O-08. Флаг отключения оплаты картой

- Статус: DONE
- Цель: сайт можно запустить только с наложенным платежом, пока нет боевого токена Monobank.
- Файлы: `src/lib/payment/index.ts`, `src/app/api/orders/route.ts`, `src/app/(public)/checkout/page.tsx`.
- Входы и выходы:
  - `index.ts`: `isOnlinePaymentEnabled(): boolean` - `process.env.NEXT_PUBLIC_ONLINE_PAYMENT_ENABLED !== "false"`.
  - Роут: при `paymentMethod === "ONLINE_CARD"` и выключенном флаге ответ 400 `{ error: "Оплата карткою тимчасово недоступна. Оберіть накладений платіж." }`, заказ не создается.
  - Чекаут: при выключенном флаге вариант "Оплата карткою онлайн" не показывается, по умолчанию выбран наложенный платеж. При включенном поведение прежнее.
- Критерии приемки:
  - `БАЗА` зеленая.
  - `NEXT_PUBLIC_ONLINE_PAYMENT_ENABLED=false npm run build` проходит.
  - `grep -n "isOnlinePaymentEnabled" src/app/api/orders/route.ts "src/app/(public)/checkout/page.tsx"` находит обе точки использования.
- Модель: haiku
- Зависимости: O-07, C-02.

---

## Этап 3. Контент и юридическое (кодовая часть)

### C-01. Исправления страницы товара

- Статус: DONE
- Цель: убрать неверную ссылку и неверный текст со страницы, на которую придет реклама.
- Файлы: `src/app/(public)/product/[productSlug]/page.tsx`.
- Входы и выходы:
  - Кнопка "Замовити в Telegram": `href` = `SITE.telegramUrl` (сейчас `https://t.me`).
  - Из `ACCORDION_SECTIONS` удалить раздел "Про модель" (зашитый текст про теплый мех неверен для летней обуви; описание товара уже выводится из `product.description`).
  - Раздел "Розмір і посадка": текст оставить, добавить ссылку "Розмірна сітка" на `/size-guide`. Раздел "Доставка та оплата": добавить ссылку "Детальніше" на `/delivery`.
- Критерии приемки:
  - `grep -n "хутро\|\"https://t.me\"" "src/app/(public)/product/[productSlug]/page.tsx"` ничего не выводит.
  - `npm run typecheck && npm run lint` без ошибок.
- Модель: haiku
- Зависимости: F-02.

### C-02. Публичная оферта, юридические ссылки, согласие на чекауте

- Статус: DONE
- Цель: на сайте есть каркас всех страниц, которые требуют закон об электронной коммерции, эквайринг и рекламный кабинет.
- Файлы: `src/app/(public)/oferta/page.tsx` (новый), `src/components/layout/Footer.tsx`, `src/app/(public)/contacts/page.tsx`, `src/app/(public)/checkout/page.tsx`.
- Входы и выходы:
  - `/oferta`: страница "Публічна оферта" в стиле `/privacy`, с `PlaceholderNotice`. Разделы-заголовки с короткими нейтральными абзацами-черновиками: загальні положення, предмет договору, оформлення замовлення, ціна та оплата, доставка, повернення та обмін (14 днів), відповідальність сторін, персональні дані (ссылка на `/privacy`), реквізити продавця (из `SITE.seller`; пустые поля выводить как "[буде додано]"). В коде комментарий: черновик, финальный текст дает клиентка, нужна проверка юристом.
  - Футер, колонка "Покупцям": добавить ссылки "Публічна оферта" (`/oferta`) и "Політика конфіденційності" (`/privacy`).
  - Контакты: блок "Продавець" с реквизитами из `SITE.seller` (показывать только непустые поля; если все пустые, блок не выводить).
  - Чекаут: под кнопкой отправки заказа строка мелким шрифтом "Оформлюючи замовлення, ви погоджуєтесь з публічною офертою та політикою конфіденційності" со ссылками на `/oferta` и `/privacy` (открываются в новой вкладке). Чекбокс не добавлять.
- Критерии приемки:
  - `БАЗА` зеленая, `npm run build` проходит и в выводе сборки есть маршрут `/oferta`.
  - `grep -n "/oferta" src/components/layout/Footer.tsx "src/app/(public)/checkout/page.tsx"` находит ссылки в обоих файлах.
- Модель: sonnet
- Зависимости: F-02.

### C-03. Блок отзывов из файла, скрыт пока отзывов нет

- Статус: DONE
- Цель: на главной не висят отзывы-заглушки; реальные скриншоты подключаются добавлением файлов.
- Файлы: `src/content/reviews.ts` (новый), `src/components/home/ReviewsSection.tsx` (новый), `src/app/(public)/page.tsx`.
- Входы и выходы:
  - `reviews.ts`: `export const REVIEWS: { src: string; alt: string }[] = []` с комментарием: файлы кладутся в `public/reviews/`, путь вида `/reviews/01.jpg`.
  - `ReviewsSection`: принимает список; при пустом списке возвращает `null`; иначе заголовок "Живі відгуки клієнток" (как сейчас) и горизонтальная прокручиваемая лента скриншотов (`<img loading="lazy">`, фиксированная высота, `object-contain`).
  - `page.tsx`: удалить `getReviews()` и текущую секцию отзывов, вставить `<ReviewsSection reviews={REVIEWS} />` на то же место. Строки `Review` в БД не трогать.
- Критерии приемки:
  - `grep -n "prisma.review\|Скриншот відгуку" "src/app/(public)/page.tsx"` ничего не выводит.
  - `npm run typecheck && npm run lint` без ошибок.
- Модель: haiku
- Зависимости: нет. Параллельная.

### C-04. Вставка финальных текстов клиентки (заблокирована контентом)

- Статус: BLOCKED (ждем тексты от клиентки, см. раздел "Делает человек")
- Цель: на сайте нет текстов-заглушек.
- Файлы: `src/app/(public)/about/page.tsx`, `delivery/page.tsx`, `returns/page.tsx`, `contacts/page.tsx`, `privacy/page.tsx`, `oferta/page.tsx`, `size-guide/page.tsx` (все в `src/app/(public)/`), `src/lib/site-config.ts` (реквизиты продавца).
- Входы и выходы: вход - тексты и замеры, переданные оркестратором в задаче дословно. Вставить тексты, заполнить `SITE.seller`, заменить строки `SIZE_ROWS`, убрать `PlaceholderNotice` и комментарии "ТИМЧАСОВИЙ ТЕКСТ" только с тех страниц, для которых текст получен. Ничего не дописывать от себя.
- Критерии приемки:
  - `grep -rln "PlaceholderNotice" "src/app/(public)"` не выводит страницы, для которых текст получен.
  - `БАЗА` зеленая.
- Модель: haiku
- Зависимости: C-02, S-03, контент от клиентки.

### C-05. Подключение скриншотов отзывов (заблокирована контентом)

- Статус: BLOCKED (ждем скриншоты)
- Цель: на главной показаны 8-12 реальных отзывов.
- Файлы: `public/reviews/*` (новые файлы), `src/content/reviews.ts`.
- Входы и выходы: вход - папка со скриншотами от оркестратора. Уменьшить до 1200 px по длинной стороне (`sips -Z 1200`), назвать `01.jpg`, `02.jpg` и так далее, заполнить `REVIEWS` (alt вида "Відгук клієнтки 1").
- Критерии приемки:
  - `node -e "const fs=require('fs');const n=fs.readdirSync('public/reviews').length;if(n<1)process.exit(1)"` завершается с кодом 0.
  - Каждый файл меньше 400 КБ: `find public/reviews -size +400k` ничего не выводит.
  - `БАЗА` зеленая.
- Модель: haiku
- Зависимости: C-03, контент от клиентки.

---

## Этап 4. SEO, Open Graph, ссылки для рекламы

### S-01. Общие метаданные и картинка превью по умолчанию

- Статус: DONE
- Цель: любая ссылка на сайт дает аккуратное превью в Instagram, Telegram, Viber.
- Файлы: `src/app/layout.tsx`, `src/app/opengraph-image.tsx` (новый).
- Входы и выходы:
  - `layout.tsx`, `metadata`: `metadataBase: new URL(getSiteUrl())`, `openGraph: { type: "website", locale: "uk_UA", siteName: SITE.name, title: SITE.name, description: SITE.description }`, `twitter: { card: "summary_large_image" }`, `alternates: { canonical: "/" }` не добавлять (canonical задают страницы). `title` и `description` брать из `SITE`.
  - `opengraph-image.tsx`: `ImageResponse` из `next/og`, размер 1200x630, `runtime = "edge"`, темный фон в цвет бренда (взять цвет `ink` из `tailwind.config.ts`), крупная надпись "La Mia Fortuna Shoes" и строка ниже "Kharkiv, Ukraine". Только латинские символы (встроенный шрифт не содержит кириллицы). Экспортировать `alt`, `size`, `contentType`.
- Критерии приемки:
  - `БАЗА` зеленая, `npm run build` проходит.
  - При запущенном сервере `curl -s http://localhost:3000/ | grep -c 'property="og:image"'` печатает число больше 0, и `curl -s -o /dev/null -w "%{http_code} %{content_type}" http://localhost:3000/opengraph-image` печатает `200 image/png`.
- Модель: haiku
- Зависимости: F-02.

### S-02. Метаданные и JSON-LD страницы товара

- Статус: DONE
- Цель: ссылка на товар из рекламы показывает фото, название и цену этого товара.
- Файлы: `src/app/(public)/product/[productSlug]/page.tsx`, `src/lib/seo.ts` (новый), `src/lib/seo.test.ts` (новый).
- Входы и выходы:
  - `seo.ts` (чистые функции): `truncateDescription(text, max = 160)` (обрезка по границе слова, многоточие тремя точками, схлопывание пробелов и переносов); `buildProductDescription({ name, seoDescription, description })` - `seoDescription`, иначе `description`, иначе "`<name>` - жіноче взуття La Mia Fortuna Shoes. Натуральна шкіра, власне виробництво, доставка Новою Поштою."; `buildProductJsonLd({ name, description, slug, sku, images, price, inStock, siteUrl })` - объект schema.org `Product` с `offers` (`priceCurrency: "UAH"`, `availability` InStock/OutOfStock, `url`).
  - Страница: запрос товара обернуть в `cache()` из `react`, чтобы `generateMetadata` и страница не ходили в БД дважды. `generateMetadata`: `title: product.name`, `description`, `alternates.canonical: /product/<slug>`, `openGraph: { title, description, url, images: [первое фото] }` (если фото нет, поле `images` не задавать, сработает картинка по умолчанию), `other: { "product:price:amount": цена со скидкой если есть, "product:price:currency": "UAH" }`. Товар не найден - вернуть `{}`.
  - В разметку страницы добавить `<script type="application/ld+json">` с результатом `buildProductJsonLd` (`inStock` = есть вариант со `stock > 0`).
- Критерии приемки:
  - `npm test` зеленый (тесты `truncateDescription`, `buildProductDescription`, `buildProductJsonLd`).
  - `БАЗА` зеленая, `npm run build` проходит.
  - При запущенном сервере и существующем товаре `curl -s http://localhost:3000/product/<slug> | grep -o "application/ld+json\|product:price:amount" | wc -l` печатает 2 или больше (HTML однострочный, `grep -c` всегда дает 1).
- Модель: sonnet
- Зависимости: S-01, C-01, F-01.

### S-03. Метаданные остальных страниц

- Статус: DONE
- Цель: у каждой страницы свой заголовок, служебные страницы закрыты от индексации.
- Файлы: `src/app/(public)/catalog/[categorySlug]/page.tsx`, `src/app/(public)/catalog/page.tsx`, `src/app/(public)/search/page.tsx`, страницы `about`, `delivery`, `returns`, `contacts`, `privacy`, `size-guide`, `oferta` (`page.tsx` в `src/app/(public)/`), новые `src/app/(public)/cart/layout.tsx`, `src/app/(public)/checkout/layout.tsx`, `src/app/(public)/thank-you/layout.tsx`.
- Входы и выходы:
  - Категория: `generateMetadata` через существующую `findCategoryBySlug`: `title: category.name`, `description: "<name> - La Mia Fortuna Shoes. Жіноче взуття з натуральної шкіри, доставка по Україні."`, `alternates.canonical: /catalog/<slug>` (без параметров фильтров).
  - `/catalog`: `title: "Каталог"`, canonical `/catalog`.
  - Статические страницы: `export const metadata` с `title` (по заголовку `h1` страницы) и canonical.
  - `/search`: `robots: { index: false }`. Новые `layout.tsx` для `cart`, `checkout`, `thank-you`: только `export const metadata = { title: ..., robots: { index: false, follow: false } }` и компонент, возвращающий `children` (страницы `cart` и `checkout` клиентские, метаданные из них экспортировать нельзя).
- Критерии приемки:
  - `БАЗА` зеленая, `npm run build` проходит.
  - При запущенном сервере `curl -s http://localhost:3000/checkout | grep -c 'name="robots" content="noindex'` печатает число больше 0.
  - `curl -s http://localhost:3000/delivery | grep -o "<title>[^<]*</title>"` выводит заголовок, отличный от заголовка главной.
- Модель: haiku
- Зависимости: S-01, C-02.

### S-04. sitemap.xml и robots.txt

- Статус: DONE
- Цель: поисковики видят товары и категории, служебные разделы закрыты.
- Файлы: `src/app/sitemap.ts` (новый), `src/app/robots.ts` (новый).
- Входы и выходы:
  - `sitemap.ts`: `export const dynamic = "force-dynamic"` (сборка не должна ходить в БД). Адреса: `/`, `/catalog`, `/about`, `/delivery`, `/returns`, `/contacts`, `/size-guide`, `/privacy`, `/oferta`; категории с `isVisible: true` (`/catalog/<slug>`); товары с `isPublished: true` (`/product/<slug>`, `lastModified: updatedAt`). Абсолютные адреса через `getSiteUrl()`. Запросы только с `select` нужных полей.
  - `robots.ts`: `allow: "/"`, `disallow: ["/admin", "/api", "/cart", "/checkout", "/thank-you", "/search"]`, `sitemap: getSiteUrl() + "/sitemap.xml"`.
- Критерии приемки:
  - `БАЗА` зеленая, `npm run build` проходит.
  - При запущенном сервере `curl -s http://localhost:3000/robots.txt | grep -c "Disallow: /admin"` печатает 1, `curl -s http://localhost:3000/sitemap.xml | grep -c "<loc>"` печатает 9 или больше.
- Модель: haiku
- Зависимости: F-02.

### S-05. Кнопка "Скопіювати посилання" в списке товаров админки

- Статус: DONE
- Цель: клиентка одним нажатием берет ссылку на товар для рекламы, сторис и переписки.
- Файлы: `src/components/admin/AdminProductsTable.tsx`, `src/app/(admin)/admin/products/page.tsx`.
- Входы и выходы: добавить поле `slug: string` в тип `AdminProductRow` и передать его из `page.tsx` (там строки собираются из товаров Prisma). В строке товара кнопка "Скопіювати посилання": копирует `window.location.origin + "/product/" + slug` через `navigator.clipboard.writeText`, на 1.5 секунды меняет подпись на "Скопійовано". Для неопубликованного товара кнопку не показывать. Slug как текст не выводить.
- Критерии приемки:
  - `grep -n "Скопіювати посилання" src/components/admin/AdminProductsTable.tsx` находит строку.
  - `npm run typecheck && npm run lint` без ошибок.
- Модель: haiku
- Зависимости: нет. Параллельная.

---

## Этап 5. Аналитика и реклама

### A-01. Ядро аналитики: сборка и отправка событий

- Статус: TODO
- Цель: одно внутреннее событие превращается в корректные параметры GA4 и Meta Pixel; логика покрыта тестами.
- Файлы: `src/lib/analytics/events.ts` (новый), `src/lib/analytics/events.test.ts` (новый), `src/lib/analytics/track.ts` (новый), `src/types/analytics.d.ts` (новый).
- Входы и выходы:
  - Типы: `AnalyticsItem = { id: string; name: string; price: number; quantity: number; variant?: string }` (`id` = slug товара). `AnalyticsEvent` = `{ name: "view_item"; item }` | `{ name: "add_to_cart"; item }` | `{ name: "begin_checkout"; items }` | `{ name: "purchase"; orderNumber: string; items; value: number }`.
  - `toGa4(event)` -> `{ name, params }`: `currency: "UAH"`, `value` (сумма `price * quantity`, для purchase переданное `value`), `items: [{ item_id, item_name, price, quantity, item_variant }]`, для purchase `transaction_id: orderNumber`.
  - `toMetaPixel(event)` -> `{ name, params, eventId? }`: имена `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`; `params`: `content_type: "product"`, `content_ids`, `contents: [{ id, quantity }]`, `value`, `currency: "UAH"`, `num_items` (для checkout и purchase); `eventId = orderNumber` для purchase.
  - `track(event)` (клиент): если `typeof window === "undefined"` - выход; если есть `window.gtag` - `gtag("event", name, params)`; если есть `window.fbq` - `fbq("track", name, params, eventId ? { eventID: eventId } : undefined)`. Обернуть в try/catch, исключений наружу не бросать.
  - `analytics.d.ts`: объявления `window.gtag`, `window.fbq`, `window.dataLayer`.
- Критерии приемки:
  - `npm test` зеленый: тесты на все 4 события для обоих преобразований (суммы, валюта, идентификаторы, `eventId`).
  - `БАЗА` зеленая.
- Модель: sonnet
- Зависимости: F-01.

### A-02. Загрузка GA4 и Meta Pixel, просмотры страниц

- Статус: TODO
- Цель: скрипты аналитики грузятся только в публичной части и только при заданных ID.
- Файлы: `src/components/analytics/AnalyticsScripts.tsx` (новый), `src/components/analytics/PageViewTracker.tsx` (новый), `src/app/(public)/layout.tsx`.
- Входы и выходы:
  - `AnalyticsScripts` (серверный компонент): читает `process.env.NEXT_PUBLIC_GA4_ID` и `NEXT_PUBLIC_META_PIXEL_ID`. Для каждого непустого ID рендерит `next/script` со `strategy="afterInteractive"`: GA4 - `gtag.js` и инициализация `gtag("config", id)`; Pixel - стандартный сниппет `fbq("init", id)` и `fbq("track", "PageView")`. Оба ID пустые - компонент возвращает `null`.
  - `PageViewTracker` (клиентский): по смене `usePathname()` отправляет `fbq("track", "PageView")`, пропуская первый рендер (первый просмотр уже отправил сниппет). GA4 переходы внутри сайта считает сам (enhanced measurement), вручную не дублировать.
  - `(public)/layout.tsx`: добавить оба компонента. В админский layout не добавлять.
- Критерии приемки:
  - `БАЗА` зеленая.
  - `NEXT_PUBLIC_GA4_ID=G-TEST123 NEXT_PUBLIC_META_PIXEL_ID=1234567890 npm run build` проходит, после него `grep -rl "G-TEST123" .next/server/app | head -1` находит файл. Затем `rm -rf .next`.
  - `npm run build` без этих переменных проходит, `grep -rl "googletagmanager" .next/server/app | wc -l` печатает 0. Затем `rm -rf .next`.
- Модель: sonnet
- Зависимости: A-01.

### A-03. События просмотра товара, корзины и начала оформления

- Статус: TODO
- Цель: в Pixel и GA4 уходят ViewContent, AddToCart, InitiateCheckout.
- Файлы: `src/components/analytics/TrackViewItem.tsx` (новый), `src/app/(public)/product/[productSlug]/page.tsx`, `src/components/product/ProductOptions.tsx`, `src/components/catalog/ProductCard.tsx`, `src/app/(public)/checkout/page.tsx`.
- Входы и выходы:
  - `TrackViewItem` (клиентский, рендерит `null`): принимает `item`, в `useEffect` один раз на slug вызывает `track({ name: "view_item", item })`. Вставить на страницу товара (цена = цена со скидкой, если есть; `quantity: 1`).
  - `ProductOptions.handleAddToCart` и быстрое добавление в `ProductCard`: после `addItem` вызвать `track({ name: "add_to_cart", item })` (`id` = slug товара, `variant` = "размер / цвет").
  - Чекаут: при первом показе страницы с непустой корзиной один раз `track({ name: "begin_checkout", items })` (через `useRef`-флаг, с учетом того, что корзина из localStorage появляется после гидратации).
  - Поведение и внешний вид не менять.
- Критерии приемки:
  - `grep -rn "track(" src/components/product/ProductOptions.tsx src/components/catalog/ProductCard.tsx "src/app/(public)/checkout/page.tsx" src/components/analytics/TrackViewItem.tsx | wc -l` печатает 4 или больше.
  - `БАЗА` зеленая, `npm run build` проходит.
- Модель: sonnet
- Зависимости: A-02, S-02, O-08.

### A-04. Событие покупки на странице благодарности

- Статус: TODO
- Цель: Purchase уходит один раз на заказ и только за реальный заказ.
- Файлы: `src/components/analytics/TrackPurchase.tsx` (новый), `src/app/(public)/thank-you/page.tsx`.
- Входы и выходы:
  - `TrackPurchase` (клиентский, рендерит `null`): пропсы `orderNumber`, `value`, `items`. В `useEffect`: если в localStorage есть ключ `lmf-purchase:<orderNumber>` - ничего не делать; иначе `track({ name: "purchase", ... })` и записать ключ. Доступ к localStorage в try/catch.
  - Страница: рендерить `TrackPurchase` только если сводка заказа получена и (`paymentKind === "COD"` или `paymentStatus === "PAID"`).
  - Так как скрипты Pixel/GA4 грузятся `afterInteractive`, событие может вызваться раньше их загрузки: в `TrackPurchase` повторять попытку до 10 раз с шагом 500 мс, пока не появится `window.fbq` или `window.gtag`; если не появились - выйти без записи ключа.
- Критерии приемки:
  - `БАЗА` зеленая, `npm run build` проходит.
  - `grep -n "TrackPurchase" "src/app/(public)/thank-you/page.tsx"` находит использование внутри условия по статусу оплаты.
- Модель: sonnet
- Зависимости: A-02, O-05.

### A-05. Захват UTM-меток и источника перехода

- Статус: TODO
- Цель: сайт запоминает, с какой рекламы пришел покупатель.
- Файлы: `src/lib/analytics/attribution.ts` (новый), `src/lib/analytics/attribution.test.ts` (новый), `src/components/analytics/AttributionCapture.tsx` (новый), `src/app/(public)/layout.tsx`.
- Входы и выходы:
  - Тип `Attribution = { utm_source?, utm_medium?, utm_campaign?, utm_content?, utm_term?, fbclid?, landing?: string, referrer?: string, capturedAt: string }` (все строки, каждая обрезается до 200 символов).
  - `parseAttribution(search: string, referrer: string, pathname: string, now: Date): Attribution | null` - чистая функция. Возвращает объект, если в `search` есть хотя бы одна `utm_*` или `fbclid`. Если меток нет, но хост `referrer` содержит `instagram.` или `facebook.` - `{ utm_source: "instagram" | "facebook", utm_medium: "referral", ... }`. Иначе `null`. `landing` = `pathname`, `referrer` = только хост.
  - `mergeAttribution(existing: Attribution | null, incoming: Attribution | null, now: Date): Attribution | null` - новое непустое значение заменяет старое; старое сохраняется, если нового нет и ему меньше 30 дней; иначе `null`.
  - `readAttribution()` / `writeAttribution()` - localStorage, ключ `lmf-attribution`, try/catch.
  - `AttributionCapture` (клиентский, `null`): один раз при загрузке читает `window.location` и `document.referrer`, сливает и сохраняет. Подключить в `(public)/layout.tsx`.
- Критерии приемки:
  - `npm test` зеленый: метки из строки запроса, только `fbclid`, реферер Instagram без меток, прямой заход (`null`), замена старого значения новым, истечение через 30 дней, обрезка длинных значений.
  - `БАЗА` зеленая.
- Модель: sonnet
- Зависимости: A-02.

### A-06. Сохранение источника в заказ

- Статус: TODO
- Цель: в каждом заказе хранится, откуда пришел покупатель.
- Файлы: `prisma/schema.prisma`, новая папка миграции в `prisma/migrations/`, `src/lib/checkout-schema.ts`, `src/lib/checkout-schema.test.ts`, `src/app/api/orders/route.ts`, `src/app/(public)/checkout/page.tsx`.
- Входы и выходы:
  - Схема: в модель `Order` добавить `attribution Json?`. Миграция только добавляющая: `npx prisma migrate dev --name add_order_attribution`. Если Prisma предлагает сброс базы или предупреждает о потере данных - остановиться и сообщить (правило 2).
  - `createOrderSchema`: необязательное поле `attribution` - объект со строковыми необязательными полями из типа `Attribution` (каждое `max(200)`), лишние ключи отбрасываются.
  - Чекаут: при отправке добавить в тело `attribution: readAttribution() ?? undefined`.
  - Роут: сохранить `attribution` в заказ (если есть).
- Критерии приемки:
  - `npx prisma validate` без ошибок; `git status --short prisma/migrations` показывает одну новую папку, в ее `migration.sql` только `ALTER TABLE "Order" ADD COLUMN "attribution" JSONB;`.
  - `npm test` зеленый (тест схемы: объект с метками проходит, лишний ключ отбрасывается, строка длиннее 200 символов отклоняется).
  - `БАЗА` зеленая.
- Модель: sonnet
- Зависимости: A-05, A-03, O-08.

### A-07. Источник заказа в админке и в Telegram

- Статус: TODO
- Цель: клиентка видит, какая реклама принесла заказ.
- Файлы: `src/app/(admin)/admin/orders/[id]/page.tsx`, `src/lib/notify/telegram.ts`, `src/lib/notify/telegram.test.ts`.
- Входы и выходы:
  - Чистая функция `formatAttribution(attribution: unknown): string | null` в `telegram.ts`: строка вида "instagram / paid / назва_кампанії" из `utm_source`, `utm_medium`, `utm_campaign` (пропуская пустые); если есть только `fbclid` - "Реклама Meta"; если данных нет - `null`.
  - Карточка заказа в админке: строка "Звідки прийшов покупець: ..." (если `null` - "Прямий перехід або невідомо"). Сырые ключи UTM не показывать.
  - `formatNewOrderMessage`: добавить строку "Джерело: ..." если `formatAttribution` вернула не `null`.
- Критерии приемки:
  - `npm test` зеленый (тесты `formatAttribution`: полный набор, только источник, только `fbclid`, пусто, не объект).
  - `БАЗА` зеленая.
- Модель: haiku
- Зависимости: A-06, O-06.

---

## Этап 6. Скорость на мобильном

### P-01. Сжатие фото в браузере при загрузке в админке

- Статус: TODO
- Цель: фото с телефона (до 5 МБ) попадают в хранилище уже уменьшенными, сайт и загрузка в админке быстрее.
- Файлы: `src/lib/admin/compress-image.ts` (новый), `src/lib/admin/compress-image.test.ts` (новый), `src/components/admin/ProductForm.tsx`, `src/components/admin/HomepageSettingsForm.tsx`.
- Входы и выходы:
  - `computeTargetSize(width, height, maxSide = 1600): { width; height }` - чистая функция (пропорции сохраняются, маленькие картинки не увеличиваются, результат целый).
  - `compressImage(file: File): Promise<File>` (только браузер): для `image/jpeg`, `image/png`, `image/webp` декодировать (`createImageBitmap` с `imageOrientation: "from-image"`), нарисовать на canvas с размером из `computeTargetSize`, получить `toBlob("image/webp", 0.82)`; если тип результата не `image/webp` (Safari) - повторить как `image/jpeg` с качеством 0.85. Вернуть новый `File` с верным расширением. Если результат не меньше исходного или произошла любая ошибка - вернуть исходный файл.
  - В обеих формах вызывать `compressImage` перед отправкой файла на `/api/admin/upload`. Интерфейс формы не менять (никаких новых полей и настроек).
- Критерии приемки:
  - `npm test` зеленый (тесты `computeTargetSize`: альбомная, портретная, маленькая, квадратная).
  - `grep -n "compressImage" src/components/admin/ProductForm.tsx src/components/admin/HomepageSettingsForm.tsx` находит использование в обоих файлах.
  - `БАЗА` зеленая.
- Модель: sonnet
- Зависимости: F-01.

### P-02. next/image для публичных картинок

- Статус: TODO
- Цель: телефон получает картинку нужного размера, а не оригинал.
- Файлы: `src/lib/image.ts` (новый), `src/lib/image.test.ts` (новый), `src/components/catalog/ProductCard.tsx`, `src/components/product/ProductGallery.tsx`, `src/components/home/Hero.tsx`, `src/components/catalog/CategoryGrid.tsx`, `src/app/(public)/page.tsx`.
- Входы и выходы:
  - `isOptimizableImage(url: string): boolean` - `true`, если URL https и хост заканчивается на `.supabase.co`, иначе `false` (невалидный URL - `false`).
  - Заменить `<img>` на `next/image` с `fill` (родитель `relative`, классы `object-cover` сохранить) и `unoptimized={!isOptimizableImage(src)}`.
  - `sizes`: карточка товара `(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw`; главное фото галереи `(max-width: 768px) 100vw, 50vw` и `priority`; миниатюры галереи `80px`; баннер `(max-width: 768px) 100vw, 50vw` и `priority`; плитки категорий `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw`.
  - Корзину, чекаут и админку не трогать. Верстку и анимации при наведении сохранить.
- Критерии приемки:
  - `npm run lint 2>&1 | grep -c "no-img-element"` печатает 0 для перечисленных файлов (предупреждения в других файлах допустимы).
  - `npm test` зеленый (тесты `isOptimizableImage`).
  - `БАЗА` зеленая, `npm run build` проходит.
- Модель: sonnet
- Зависимости: F-03, A-03, C-03.

### P-03. Кэширование публичных чтений (условная)

- Статус: TODO (выполнять только после замера в Q-03: если TTFB страницы товара на деплое больше 800 мс)
- Цель: страница товара и главная не ходят в БД на каждый просмотр.
- Файлы: `src/lib/public-data.ts` (новый), `src/lib/site-settings.ts`, `src/components/layout/Header.tsx`, `src/app/(public)/product/[productSlug]/page.tsx`, `src/app/(public)/page.tsx`, `src/app/api/admin/products/route.ts`, `src/app/api/admin/products/[id]/route.ts`, `src/app/api/admin/settings/route.ts`, `src/app/api/admin/import/route.ts`.
- Входы и выходы:
  - По образцу `findCategoryBySlug` в `src/lib/catalog.ts` обернуть в `unstable_cache`: товар по slug (тег `products`, 300 секунд), данные главной (теги `products`, `categories`, `settings`, 300 секунд), настройки сайта (тег `settings`), категории шапки (тег `categories`).
  - Кэшируемые функции возвращают только простые значения: `Decimal` привести к `number`, `Date` к строке ISO (кэш сериализует в JSON).
  - Во всех админских мутациях товаров и импорта вызвать `revalidateTag("products")`, в настройках `revalidateTag("settings")`.
  - `force-dynamic` на страницах оставить (страницы рендерятся на запрос, но без похода в БД).
- Критерии приемки:
  - `БАЗА` зеленая, `npm run build` проходит.
  - `grep -c "revalidateTag(\"products\")" src/app/api/admin/products/route.ts "src/app/api/admin/products/[id]/route.ts" src/app/api/admin/import/route.ts` показывает не меньше 1 для каждого файла.
  - Ручная проверка оркестратором: изменить цену товара в админке, обновить страницу товара, цена новая.
- Модель: sonnet
- Зависимости: P-02, S-02, Q-03.

---

## Этап 7. Документация, тесты, приемка

### D-01. Гайд по админке для клиентки

- Статус: TODO
- Цель: клиентка может сама вести магазин по короткой инструкции.
- Файлы: `docs/admin-guide.md` (новый).
- Входы и выходы: прочитать `src/app/(admin)/admin/**` и `src/components/admin/**`, описать простым языком на украинском, без технических слов: вход; добавление товара (название, цена, фото перетаскиванием, размеры "є/немає", цвета, "Показувати на сайті", "Новинка", "Розпродаж", показ на главной); категории; цвета; главная страница (баннер, сезонная коллекция); заказы (статусы, ввод ТТН, ручная отметка оплаты); кнопка "Скопіювати посилання" и как вставлять ссылку в рекламу и сторис; что делать, если пришло сообщение о заказе в Telegram. Описывать только то, что реально есть в коде. Разделы, скрытые из меню, не описывать.
- Критерии приемки:
  - `test -s docs/admin-guide.md` завершается с кодом 0.
  - Каждый пункт меню из `src/app/(admin)/admin/layout.tsx` упомянут в гайде: проверка `grep` по подписям пунктов.
  - В файле нет длинных тире: `grep -c $'\xe2\x80\x94' docs/admin-guide.md` печатает 0.
- Модель: sonnet
- Зависимости: F-06, S-05, P-01, A-07.

### D-02. Актуализация документации запуска

- Статус: TODO
- Цель: чек-листы и описание проекта соответствуют коду.
- Файлы: `DEPLOY-CHECKLIST.md`, `CREDENTIALS.md`, `README.md`, `CLAUDE.md`.
- Входы и выходы:
  - `DEPLOY-CHECKLIST.md`: отметить выполненное из раздела 2; добавить переменные `NEXT_PUBLIC_ONLINE_PAYMENT_ENABLED`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID`; `&connection_limit=1` для `DATABASE_URL`; шаги `npm run check:env -- --prod`, `npm run prisma:deploy`, `BASE_URL=https://<домен> npm run smoke`; уточнить, что вебхук Monobank в кабинете настраивать не нужно (адрес передается в счете, важен верный `NEXT_PUBLIC_SITE_URL`); правило rate limit в Vercel Firewall для `/api/orders` и `/api/admin/login`; Preview-окружение Vercel использует dev-БД.
  - `CREDENTIALS.md`: разделы "Telegram-бот" (создать через @BotFather, добавить бота в чат, получить `chat_id`), "GA4" (где взять Measurement ID), "Meta Pixel" (где взять ID пикселя).
  - `README.md`: заменить описание шаблона на описание этого проекта (без личного кабинета, без NextAuth), команды, ссылки на `docs/`.
  - `CLAUDE.md`: исправить описание `prisma/seed.ts` (только добавляет, ничего не удаляет, демо-товаров нет); в разделе про GA4/Pixel указать `src/lib/analytics/`; добавить `npm test`, `npm run smoke`, `npm run check:env` в команды. Раздел "Рабочий процесс" не менять.
- Критерии приемки:
  - `grep -c "очищує й пересоздає" CLAUDE.md` печатает 0; `grep -c "NextAuth" README.md` печатает 0.
  - `grep -c "TELEGRAM_BOT_TOKEN" DEPLOY-CHECKLIST.md CREDENTIALS.md` показывает не меньше 1 для каждого файла.
  - `grep -c $'\xe2\x80\x94' README.md` печатает 0 (в новых текстах длинных тире нет).
- Модель: haiku
- Зависимости: F-03, F-04, O-06, O-08, A-06, Q-01.

### Q-01. Дымовой скрипт

- Статус: TODO
- Цель: одной командой проверить, что развернутый сайт жив и закрыт где надо. Скрипт ничего не пишет в БД.
- Файлы: `scripts/smoke.mjs` (новый), `package.json`.
- Входы и выходы:
  - `package.json`: `"smoke": "node scripts/smoke.mjs"`. Адрес из `BASE_URL` (по умолчанию `http://localhost:3000`).
  - Проверки (каждая печатает OK/FAIL, в конце итог, код 1 при любом FAIL): `GET /`, `/catalog`, `/delivery`, `/oferta`, `/privacy`, `/size-guide` -> 200; `/robots.txt` содержит `Disallow: /admin`; `/sitemap.xml` -> 200 и содержит `<loc>`; если в sitemap есть адрес `/product/`, первый такой адрес -> 200 и содержит `og:image`; `/product/takogo-tovaru-nemaie` -> 404; `GET /admin` без cookie -> редирект на `/admin/login` (`redirect: "manual"`, статус 307 или 308); `GET /api/admin/orders` -> 401; `POST /api/orders` с телом `{}` -> 400; `POST /api/payments/monobank/webhook` без заголовка `X-Sign` -> 400; `POST /api/payments/liqpay/callback` с пустой формой -> 400; заголовок `x-content-type-options: nosniff` на `/`.
  - Без зависимостей, только встроенный `fetch`.
- Критерии приемки:
  - При запущенном локальном сервере `npm run smoke` завершается с кодом 0.
  - `BASE_URL=http://localhost:9 npm run smoke; echo $?` печатает `1` (скрипт не падает с необработанным исключением, а сообщает FAIL).
  - `БАЗА` зеленая.
- Модель: sonnet
- Зависимости: F-04, O-07, O-05, S-04, C-02, F-03.

### Q-02. Чек-лист ручной приемки

- Статус: TODO
- Цель: владелец проходит полный путь покупки по списку, не придумывая сценарии сам.
- Файлы: `docs/acceptance.md` (новый).
- Входы и выходы: чек-лист с отметками, на русском, шаги для телефона. Разделы: (1) админка: вход, товар с фото и размерами, проверка в каталоге, поиске, на главной, кнопка копирования ссылки; (2) покупка наложенным платежом: корзина, чекаут, автокомплит Новой Почты, страница благодарности, заказ в админке, сообщение в Telegram; (3) покупка картой на тестовом токене Monobank: оплата, возврат на сайт, статус "Оплату отримано", второе сообщение в Telegram, статус в админке; закрыть вкладку до возврата на сайт и убедиться, что статус обновился вебхуком; (4) недоступный размер: отметить размер "немає", попытаться оформить из старой корзины, увидеть понятную ошибку; (5) ссылка из Instagram: отправить себе ссылку на товар в директ, открыть во встроенном браузере, проверить превью, скорость, добавление в корзину, оформление; (6) аналитика: Meta Pixel Helper или "Тестирование событий" в Events Manager и DebugView в GA4 показывают 4 события, Purchase один раз после обновления страницы; ссылка с `?utm_source=instagram&utm_medium=paid&utm_campaign=test` дает источник в карточке заказа; (7) скорость: PageSpeed Insights (мобильный) для главной и страницы товара, записать LCP и TTFB; (8) превью ссылок в Telegram и Viber; (9) юридическое: нет плашек-заглушек, оферта и политика открываются из футера и чекаута.
- Критерии приемки:
  - `test -s docs/acceptance.md` завершается с кодом 0; `grep -c "\[ \]" docs/acceptance.md` печатает 25 или больше.
  - `grep -c $'\xe2\x80\x94' docs/acceptance.md` печатает 0.
- Модель: haiku
- Зависимости: A-04, A-07, O-06.

### Q-03. Финальная проверка перед запуском

- Статус: TODO
- Цель: зафиксировать, что код готов к передаче клиентке.
- Файлы: нет (только запуск команд и отчет; исправления оформляются отдельными задачами).
- Входы и выходы: выполнить по порядку и вернуть отчет с результатом каждой команды: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` (затем `rm -rf .next`), `npm run check:env`, запуск сервера и `npm run smoke`, `grep -rln "PlaceholderNotice" "src/app/(public)"` (список страниц с заглушками), `git status --short` (нет незакоммиченных секретов, `.env` не в индексе). Замеры скорости и ручной чек-лист `docs/acceptance.md` проходит человек на временном адресе Vercel; результат TTFB определяет, нужна ли P-03.
- Критерии приемки: все команды завершились с кодом 0; список страниц с `PlaceholderNotice` пуст либо совпадает со списком, по которому контент еще не получен (тогда запуск рекламы блокируется, см. ниже).
- Модель: haiku
- Зависимости: все задачи этапов 1-5, P-01, P-02, D-01, D-02, Q-01, Q-02.

---

## Делает человек (не задачи кода)

Решения и покупки (владелец проекта):

- [ ] Ответить на вопросы архитектора (список в отчете оркестратора).
- [ ] Решить, на кого оформляются аккаунты (рекомендация: домен, Vercel, Supabase на клиентку).
- [ ] Купить домен, настроить DNS на Vercel.
- [ ] Vercel: создать проект из GitHub, тариф для коммерческого сайта, регион функций Frankfurt, переменные окружения отдельно для Production и Preview (Preview = dev-БД).
- [ ] Supabase: отдельный production-проект (`eu-central-1`), тариф с бэкапами, bucket `product-images` публичный.
- [ ] Перед каждой миграцией на проде сделать бэкап; накатить `npm run prisma:deploy`, затем `npm run prisma:seed` (один раз, только добавляет).
- [ ] Сгенерировать новые `ADMIN_SESSION_SECRET` и пароль админки для прода.
- [ ] Monobank: тестовый токен для приемки, затем бизнес-счет и эквайринг на ФОП клиентки, боевой токен; уточнить у Monobank требования к сайту (оферта, контакты, логотипы платежных систем).
- [ ] Ключ API Новой Почты.
- [ ] Telegram: создать бота через @BotFather, добавить в чат клиентки, получить `chat_id`.
- [ ] Meta: Business Manager, рекламный аккаунт, Pixel (ID), подтверждение домена; GA4: ресурс и Measurement ID.
- [ ] Vercel Firewall: правило rate limit для `/api/orders` и `/api/admin/login`.
- [ ] GitHub: для F-05 токену нужен доступ `workflow` (иначе push файла workflow отклонится).
- [ ] Пройти `docs/acceptance.md` на временном адресе, затем на домене; одна реальная оплата на минимальную сумму.
- [ ] После приемки удалить тестовые заказы и демо-товары (удаление данных только вручную и после подтверждения, в админке).
- [ ] Google Search Console: добавить сайт и sitemap.
- [ ] После 2026-11-16 сменить модель в `.claude/agents/architect.md` на `opus`.

Контент от клиентки:

- [ ] Тексты: Про нас, Доставка та оплата, Повернення/обмін, Контакти.
- [ ] Публичную оферту и политику конфиденциальности готовим мы (решение владельца), от клиентки нужны только реквизиты ФОП; разовая проверка юристом желательна.
- [ ] Реквизиты ФОП: ФИО, РНОКПП, адрес, email, телефон (для оферты, контактов и Monobank).
- [ ] Замеры для размерной сетки (длина стопы по размерам 36-41).
- [ ] 8-12 скриншотов отзывов.
- [ ] Новые обложки категорий (включая "Літнє взуття", у нее обложки нет) и фото баннера. Баннер клиентка загружает сама в "Головна сторінка"; обложки разработчик подставляет вручную (запись в БД, с подтверждением владельца).
- [ ] Реальные товары через админку (после гайда D-01).

Блокеры запуска рекламы: C-04 выполнена для privacy, oferta, delivery, returns, contacts; пройден `docs/acceptance.md`; заданы ID Pixel и GA4.
