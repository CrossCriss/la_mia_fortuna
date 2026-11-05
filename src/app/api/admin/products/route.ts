import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productFormSchema } from "@/lib/admin/product-schema";

export const dynamic = "force-dynamic";

// Адмін-CRUD товарів. Список для сторінки /admin/products читається напряму
// через Prisma в самому Server Component — цей GET лишається для повноти API.
export async function GET() {
  const products = await prisma.product.findMany({
    include: { images: true, variants: true, category: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = productFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некоректні дані", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { images, variants, ...productFields } = parsed.data;

  try {
    const product = await prisma.product.create({
      data: {
        ...productFields,
        images: {
          create: images.map((image, index) => ({
            url: image.url,
            alt: image.alt,
            position: index,
          })),
        },
        variants: {
          create: variants.map((variant) => ({
            sizeId: variant.sizeId,
            colorId: variant.colorId,
            stock: variant.stock,
          })),
        },
      },
      include: { images: true, variants: true },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Товар з таким SKU або slug вже існує" },
        { status: 409 }
      );
    }
    throw error;
  }
}
