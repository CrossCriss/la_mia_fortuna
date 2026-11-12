// Перевірка змінних середовища перед деплоєм.
// Запуск: npm run check:env            (локально, з .env)
//         npm run check:env -- --prod  (додаткові перевірки для продакшену)
// Значення змінних не виводяться, лише їх назви.

const isProd = process.argv.includes("--prod");

// Без них сайт не запуститься або не зможе працювати.
const REQUIRED = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_SITE_URL",
  "ADMIN_SESSION_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NOVA_POSHTA_API_KEY",
];

// Необов'язкові: якщо порожні, це лише попередження.
const OPTIONAL = [
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "NEXT_PUBLIC_GA4_ID",
  "NEXT_PUBLIC_META_PIXEL_ID",
];

const value = (name) => (process.env[name] ?? "").trim();

const errors = [];
const warnings = [];

for (const name of REQUIRED) {
  if (!value(name)) {
    errors.push(`Не задано обов'язкову змінну ${name}`);
  }
}

for (const name of OPTIONAL) {
  if (!value(name)) {
    warnings.push(`Порожня змінна ${name}, відповідна функція не працюватиме`);
  }
}

// Оплата карткою: якщо вона увімкнена, без токена Monobank чекаут впаде з помилкою.
if (value("NEXT_PUBLIC_ONLINE_PAYMENT_ENABLED") !== "false" && !value("MONOBANK_TOKEN")) {
  errors.push(
    "Оплата карткою увімкнена (NEXT_PUBLIC_ONLINE_PAYMENT_ENABLED не «false»), але не задано MONOBANK_TOKEN",
  );
}

if (isProd) {
  const siteUrl = value("NEXT_PUBLIC_SITE_URL");
  if (siteUrl) {
    if (!siteUrl.startsWith("https://")) {
      errors.push("NEXT_PUBLIC_SITE_URL у продакшені має починатися з https://");
    }
    if (siteUrl.includes("localhost")) {
      errors.push("NEXT_PUBLIC_SITE_URL у продакшені не може містити localhost");
    }
  }

  const secret = value("ADMIN_SESSION_SECRET");
  if (secret) {
    if (secret.length < 32) {
      errors.push("ADMIN_SESSION_SECRET має бути не коротшим за 32 символи");
    }
    if (secret.includes("сгенерируйте") || secret.includes("згенеруйте")) {
      errors.push("ADMIN_SESSION_SECRET містить заглушку, згенеруйте справжній секрет");
    }
  }

  const databaseUrl = value("DATABASE_URL");
  if (databaseUrl && !databaseUrl.includes("pgbouncer=true")) {
    errors.push("DATABASE_URL у продакшені має містити pgbouncer=true (пулер Supabase, порт 6543)");
  }
}

const mode = isProd ? " (режим --prod)" : "";

if (errors.length === 0 && warnings.length === 0) {
  console.log(`Перевірка змінних середовища${mode} пройдена, проблем не знайдено.`);
  process.exitCode = 0;
} else {
  if (errors.length > 0) {
    console.log(`Помилки${mode}:`);
    for (const message of errors) console.log(`  - ${message}`);
  }
  if (warnings.length > 0) {
    console.log("Попередження:");
    for (const message of warnings) console.log(`  - ${message}`);
  }
  process.exitCode = errors.length > 0 ? 1 : 0;
}
