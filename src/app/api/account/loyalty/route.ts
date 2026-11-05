import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLoyaltySummary } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

// Використовується клієнтським чекаутом, щоб показати рядок знижки в підсумку.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await getLoyaltySummary(session.user.id);
  return NextResponse.json(summary);
}
