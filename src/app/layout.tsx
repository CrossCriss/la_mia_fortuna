import type { Metadata, Viewport } from "next";
import { Manrope, Cormorant_Garamond } from "next/font/google";
import { cn } from "@/lib/utils";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: {
    default: "La Mia Fortuna Shoes",
    template: "%s | La Mia Fortuna Shoes",
  },
  description:
    "Жіноче взуття з натуральної шкіри. Власне виробництво, Харків, 15 років досвіду.",
};

// mobile-first: трафік з Instagram/Google — 90%+ мобільний (ТЗ §3)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" className={cn(manrope.variable, cormorant.variable)}>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
