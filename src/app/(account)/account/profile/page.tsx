import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/account/ProfileForm";
import { PasswordForm } from "@/components/account/PasswordForm";
import { SavedAddressList } from "@/components/account/SavedAddressList";

export const dynamic = "force-dynamic";

export default async function AccountProfilePage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const [user, addresses] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.savedAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Профіль</h1>
        <div className="mt-4 max-w-md">
          <ProfileForm
            initialName={user?.name ?? ""}
            initialEmail={user?.email ?? ""}
            initialPhone={user?.phone ?? ""}
          />
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-bold text-ink">Пароль</h2>
        <div className="mt-4 max-w-md">
          <PasswordForm hasPassword={Boolean(user?.passwordHash)} />
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-bold text-ink">Збережені дані доставки</h2>
        <div className="mt-4">
          <SavedAddressList
            initialAddresses={addresses.map((address) => ({
              id: address.id,
              recipientName: address.recipientName,
              phone: address.phone,
              city: address.city,
              warehouse: address.warehouse,
              isDefault: address.isDefault,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
