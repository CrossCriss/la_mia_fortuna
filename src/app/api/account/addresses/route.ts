import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const addresses = await prisma.savedAddress.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json(addresses);
}
