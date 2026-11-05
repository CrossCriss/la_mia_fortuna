import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/products?category=slug&isNew=1&isPromo=1
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get("category");
  const isNew = searchParams.get("isNew");
  const isPromo = searchParams.get("isPromo");

  const products = await prisma.product.findMany({
    where: {
      isPublished: true,
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      ...(isNew ? { isNew: true } : {}),
      ...(isPromo ? { isPromo: true } : {}),
    },
    include: { images: true, variants: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}
