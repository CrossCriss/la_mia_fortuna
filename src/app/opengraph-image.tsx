import { ImageResponse } from "next/og";

// Превью за замовчуванням для Instagram, Telegram, Viber тощо.
// Встроений шрифт next/og не містить кирилиці, тому тільки латиниця.
export const runtime = "edge";
export const alt = "La Mia Fortuna Shoes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1A1411",
          color: "#F5EFE6",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            textAlign: "center",
          }}
        >
          La Mia Fortuna Shoes
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 36,
            color: "#D9C7AE",
            letterSpacing: "0.08em",
          }}
        >
          Kharkiv, Ukraine
        </div>
      </div>
    ),
    { ...size },
  );
}
