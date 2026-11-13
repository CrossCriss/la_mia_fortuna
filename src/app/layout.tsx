import type { Metadata, Viewport } from "next";
import { Manrope, Cormorant_Garamond } from "next/font/google";
import { cn } from "@/lib/utils";
import { SITE, getSiteUrl } from "@/lib/site-config";
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
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE.name,
    template: "%s | La Mia Fortuna Shoes",
  },
  description: SITE.description,
  openGraph: {
    type: "website",
    locale: "uk_UA",
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
  },
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
      <body>{children}</body>
    </html>
  );
}
