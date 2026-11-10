import { prisma } from "@/lib/prisma";
import { getCategoryOptions } from "@/lib/admin/category-options";
import { HomepageSettingsForm } from "@/components/admin/HomepageSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  const [settings, categories] = await Promise.all([
    prisma.siteSettings.findFirst(),
    getCategoryOptions(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Головна сторінка</h1>
      <p className="mt-1 max-w-xl text-sm text-neutral-500">
        Фото у верхньому банері й картка-посилання на ньому («{settings?.seasonalLabel ?? "Нова колекція"}»
        зараз) — те саме посилання підставляється і в меню зверху та в підвалі сайту. Коли
        зʼявиться нова сезонна колекція — спочатку створіть для неї категорію в розділі{" "}
        «Категорії», а потім оберіть її тут.
      </p>

      <div className="mt-6">
        <HomepageSettingsForm
          initialValues={{
            heroImageUrl: settings?.heroImageUrl ?? null,
            heroImageAlt: settings?.heroImageAlt ?? "",
            seasonalLabel: settings?.seasonalLabel ?? "Нова колекція",
            seasonalCategoryId: settings?.seasonalCategoryId ?? null,
          }}
          categories={categories}
        />
      </div>
    </div>
  );
}
