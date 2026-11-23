import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { AttributionCapture } from "@/components/analytics/AttributionCapture";
import { ContactFloatingBar } from "@/components/home/ContactFloatingBar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-ink">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ContactFloatingBar />
      <CartDrawer />
      <AnalyticsScripts />
      <PageViewTracker />
      <AttributionCapture />
    </div>
  );
}
