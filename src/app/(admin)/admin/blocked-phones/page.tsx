import { prisma } from "@/lib/prisma";
import { formatUaPhone } from "@/lib/phone";
import { BlockPhoneButton } from "@/components/admin/BlockPhoneButton";
import { BlockedPhoneAddForm } from "@/components/admin/BlockedPhoneAddForm";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd}.${mm}.${yyyy}`;
}

export default async function BlockedPhonesPage() {
  const rows = await prisma.blockedPhone.findMany({
    orderBy: { createdAt: "desc" },
    select: { phone: true, reason: true, createdAt: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Заблоковані номери</h1>
        <p className="mt-1 text-sm text-neutral-600">
          З цих номерів не можна оформити замовлення з накладеним платежем. Оплата карткою для них доступна.
        </p>
      </div>

      <BlockedPhoneAddForm />

      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">Заблокованих номерів немає.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-600">
              <tr>
                <th className="px-3 py-2 font-medium">Номер</th>
                <th className="px-3 py-2 font-medium">Причина</th>
                <th className="px-3 py-2 font-medium">Дата блокування</th>
                <th className="px-3 py-2 font-medium">Дія</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.phone} className="border-b border-neutral-100 align-top last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap">{formatUaPhone(row.phone)}</td>
                  <td className="px-3 py-2">{row.reason || "-"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(row.createdAt)}</td>
                  <td className="px-3 py-2">
                    <BlockPhoneButton phone={row.phone} blocked reason={row.reason} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
