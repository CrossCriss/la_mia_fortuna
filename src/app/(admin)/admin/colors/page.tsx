import { prisma } from "@/lib/prisma";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AddColorForm } from "@/components/admin/AddColorForm";

export const dynamic = "force-dynamic";

export default async function AdminColorsPage() {
  const colors = await prisma.color.findMany({
    include: { _count: { select: { variants: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Кольори</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Список кольорів, доступних при додаванні товару. Додайте новий, якщо потрібного кольору
        немає в списку.
      </p>

      <div className="mt-6">
        <AddColorForm />
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Колір</th>
              <th className="px-4 py-2 font-medium">Назва</th>
              <th className="px-4 py-2 font-medium">Використовується в товарах</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {colors.map((color) => (
              <tr key={color.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-2">
                  <span
                    className="inline-block h-6 w-6 rounded-full border border-neutral-300"
                    style={{ backgroundColor: color.hex }}
                  />
                </td>
                <td className="px-4 py-2 font-medium text-neutral-900">{color.name}</td>
                <td className="px-4 py-2 text-neutral-500">{color._count.variants}</td>
                <td className="px-4 py-2 text-right">
                  <DeleteButton
                    url={`/api/admin/colors/${color.id}`}
                    confirmMessage={`Видалити колір "${color.name}"?`}
                  />
                </td>
              </tr>
            ))}
            {colors.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-400">
                  Кольорів ще немає.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
