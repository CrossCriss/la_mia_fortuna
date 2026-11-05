import { prisma } from "@/lib/prisma";
import { ImportWizard } from "@/components/admin/ImportWizard";

export const dynamic = "force-dynamic";

export default async function AdminImportPage() {
  const parentCategories = await prisma.category.findMany({
    where: { kind: "REGULAR", parentId: null },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Імпорт товарів</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Завантажте Excel-файл з CRM, зіставте колонки з полями товару та імпортуйте.
      </p>
      <div className="mt-6">
        <ImportWizard parentCategories={parentCategories} />
      </div>
    </div>
  );
}
