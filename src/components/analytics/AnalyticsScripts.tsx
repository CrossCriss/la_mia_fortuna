import Script from "next/script";

// Серверний компонент: підключає GA4 і Meta Pixel тільки за наявності ID в .env.
// Без ID нічого не рендериться, на сторінці немає жодного зовнішнього скрипта.

// Дозволені лише безпечні символи, щоб ID не міг зламати інлайн-скрипт
const SAFE_ID = /^[A-Za-z0-9_-]+$/;

function readId(value: string | undefined): string | null {
  const id = (value ?? "").trim();
  if (!id || !SAFE_ID.test(id)) return null;
  return id;
}

export function AnalyticsScripts() {
  const ga4Id = readId(process.env.NEXT_PUBLIC_GA4_ID);
  const pixelId = readId(process.env.NEXT_PUBLIC_META_PIXEL_ID);

  if (!ga4Id && !pixelId) return null;

  return (
    <>
      {ga4Id && (
        <>
          <Script
            id="ga4-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments)}
gtag("js", new Date());
gtag("config", ${JSON.stringify(ga4Id)});`}
          </Script>
        </>
      )}
      {pixelId && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");
fbq("init", ${JSON.stringify(pixelId)});
fbq("track", "PageView");`}
        </Script>
      )}
    </>
  );
}
