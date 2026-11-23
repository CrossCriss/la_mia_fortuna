// Дымова перевірка розгорнутого сайту: чи він живий і чи закриті адмінка та API.
// Запуск: npm run smoke
//         BASE_URL=https://example.com npm run smoke
// Скрипт нічого не пише в БД: єдиний POST на /api/orders іде з заздалегідь
// невалідним тілом {} і не може створити замовлення.
// Код виходу: 0 якщо всі перевірки OK або SKIP, 1 якщо є хоча б один FAIL.

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const TIMEOUT_MS = 15000;

const results = [];

function record(status, name, detail) {
  results.push(status);
  const suffix = detail ? ` - ${detail}` : "";
  console.log(`${status.padEnd(4)} ${name}${suffix}`);
}

function errorText(error) {
  const base = error instanceof Error ? error.message : String(error);
  const cause = error && typeof error === "object" ? error.cause : undefined;
  if (cause && typeof cause === "object") {
    const code = cause.code || cause.message;
    if (code) return `${base} (${code})`;
  }
  return base;
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = await response.text();
  return { response, body };
}

// Запускає перевірку; будь-який виняток (мережа, таймаут) стає FAIL.
async function check(name, fn) {
  try {
    const outcome = await fn();
    if (outcome.skip) {
      record("SKIP", name, outcome.skip);
    } else if (outcome.ok) {
      record("OK", name, outcome.note);
    } else {
      record("FAIL", name, outcome.reason);
    }
  } catch (error) {
    record("FAIL", name, `помилка запиту: ${errorText(error)}`);
  }
}

// Ознаки м'якого 404 (статус 200, але це сторінка «не знайдено»).
// Підрядок "could not be found" навмисно НЕ використовується: у Next 14 він є в
// RSC-даних кожної сторінки (стандартна заглушка notFound), тому звичайна
// сторінка теж дала б хибний OK.
function isSoftNotFound(body) {
  return (
    body.includes("NEXT_NOT_FOUND") ||
    body.includes('<meta name="robots" content="noindex"') ||
    body.includes("Сторінку не знайдено")
  );
}

const pass = (note) => ({ ok: true, note });
const fail = (reason) => ({ ok: false, reason });

async function main() {
  console.log(`Дымова перевірка: ${BASE_URL}\n`);

  // 1. Публічні сторінки.
  for (const path of ["/", "/catalog", "/delivery", "/oferta", "/privacy", "/size-guide"]) {
    await check(`GET ${path} -> 200`, async () => {
      const { response } = await request(path);
      return response.status === 200 ? pass() : fail(`отримано статус ${response.status}`);
    });
  }

  // 2. robots.txt.
  await check("GET /robots.txt містить Disallow: /admin", async () => {
    const { response, body } = await request("/robots.txt");
    if (response.status !== 200) return fail(`отримано статус ${response.status}`);
    return body.includes("Disallow: /admin") ? pass() : fail("рядка «Disallow: /admin» немає у відповіді");
  });

  // 3-4. sitemap.xml і перший товар з нього.
  let sitemapBody = null;
  await check("GET /sitemap.xml -> 200 і містить <loc>", async () => {
    const { response, body } = await request("/sitemap.xml");
    if (response.status !== 200) return fail(`отримано статус ${response.status}`);
    if (!body.includes("<loc>")) return fail("у відповіді немає жодного <loc>");
    sitemapBody = body;
    return pass();
  });

  await check("Перший товар із sitemap -> 200 і og:image", async () => {
    if (sitemapBody === null) return fail("sitemap недоступний, адресу товару взяти нема звідки");
    const locs = [...sitemapBody.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
    let productPath = null;
    for (const loc of locs) {
      let pathname;
      try {
        // Беремо лише шлях: хост у sitemap може відрізнятися від BASE_URL.
        pathname = new URL(loc).pathname;
      } catch {
        continue;
      }
      if (pathname.startsWith("/product/")) {
        productPath = pathname;
        break;
      }
    }
    if (!productPath) return { skip: "товарів у sitemap немає" };

    const { response, body } = await request(productPath);
    if (response.status !== 200) return fail(`${productPath}: отримано статус ${response.status}`);
    return body.includes("og:image") ? pass(productPath) : fail(`${productPath}: у відповіді немає og:image`);
  });

  // 5. Неіснуючий товар: справжній 404 або м'який 404 зі статусом 200.
  await check("GET /product/takogo-tovaru-nemaie -> 404", async () => {
    const { response, body } = await request("/product/takogo-tovaru-nemaie");
    if (response.status === 404) return pass();
    if (response.status === 200) {
      if (isSoftNotFound(body)) return pass("(м'який 404, статус 200)");
      return fail("статус 200 і це не сторінка «не знайдено»");
    }
    return fail(`отримано статус ${response.status}`);
  });

  // 6. Адмінка без cookie веде на логін.
  await check("GET /admin без cookie -> редирект на /admin/login", async () => {
    const { response } = await request("/admin", { redirect: "manual" });
    if (response.status !== 307 && response.status !== 308) {
      return fail(`очікувався статус 307 або 308, отримано ${response.status}`);
    }
    const location = response.headers.get("location") || "";
    return location.includes("/admin/login")
      ? pass()
      : fail(`заголовок location не містить /admin/login (location: ${location || "порожній"})`);
  });

  // 7. Адмінський API без cookie.
  await check("GET /api/admin/orders без cookie -> 401", async () => {
    const { response } = await request("/api/admin/orders");
    return response.status === 401 ? pass() : fail(`отримано статус ${response.status}`);
  });

  // 8. Створення замовлення з порожнім тілом не проходить.
  await check("POST /api/orders з {} -> 400", async () => {
    const { response } = await request("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (response.status === 400) return pass();
    // 429 теж означає, що замовлення не створено.
    if (response.status === 429) return pass("(ліміт запитів)");
    return fail(`отримано статус ${response.status}`);
  });

  // 9. Вебхук Monobank без підпису.
  await check("POST /api/payments/monobank/webhook без X-Sign -> 400", async () => {
    const { response } = await request("/api/payments/monobank/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    return response.status === 400 ? pass() : fail(`отримано статус ${response.status}`);
  });

  // 10. Callback LiqPay з порожньою формою.
  await check("POST /api/payments/liqpay/callback з порожньою формою -> 400", async () => {
    const { response } = await request("/api/payments/liqpay/callback", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "",
    });
    return response.status === 400 ? pass() : fail(`отримано статус ${response.status}`);
  });

  // 11. Захисний заголовок.
  await check("GET / має заголовок x-content-type-options: nosniff", async () => {
    const { response } = await request("/");
    const value = response.headers.get("x-content-type-options");
    return value && value.toLowerCase() === "nosniff"
      ? pass()
      : fail(`значення заголовка: ${value ?? "відсутній"}`);
  });

  const total = results.length;
  if (total === 0) {
    console.error("FAIL Не виконано жодної перевірки, скрипт працює некоректно");
    process.exitCode = 1;
    return;
  }
  const passed = results.filter((s) => s !== "FAIL").length;
  const failed = results.filter((s) => s === "FAIL").length;
  console.log(`\nПідсумок: ${passed} з ${total} пройдено`);
  process.exitCode = failed > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(`FAIL Неочікувана помилка скрипта - ${errorText(error)}`);
  process.exitCode = 1;
});
