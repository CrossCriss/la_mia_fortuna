import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { productFormSchema } from "@/lib/admin/product-schema";

const productPatchSchema = z.object({
  showOnHomepage: z.boolean(),
});

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { include: { size: true, color: true } },
    },
  });
  if (!product) {
    return NextResponse.json({ error: "Товар не знайдено" }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = productFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некоректні дані", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { images, variants, ...productFields } = parsed.data;

  const existing = await prisma.product.findUnique({
    where: { id: params.id },
    include: { images: true, variants: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Товар не знайдено" }, { status: 404 });
  }

  const submittedImageIds = new Set(images.filter((image) => image.id).map((image) => image.id!));
  const imagesToDelete = existing.images.filter((image) => !submittedImageIds.has(image.id));

  const submittedVariantIds = new Set(
    variants.filter((variant) => variant.id).map((variant) => variant.id!)
  );
  const variantsToDelete = existing.variants.filter(
    (variant) => !submittedVariantIds.has(variant.id)
  );

  try {
    await prisma.$transaction([
      prisma.product.update({ where: { id: params.id }, data: productFields }),
      ...imagesToDelete.map((image) => prisma.productImage.delete({ where: { id: image.id } })),
      ...variantsToDelete.map((variant) =>
        prisma.productVariant.delete({ where: { id: variant.id } })
      ),
      ...images.map((image, index) =>
        image.id
          ? prisma.productImage.update({
              where: { id: image.id },
              data: { url: image.url, alt: image.alt, position: index },
            })
          : prisma.productImage.create({
              data: { productId: params.id, url: image.url, alt: image.alt, position: index },
            })
      ),
      ...variants.map((variant) =>
        variant.id
          ? prisma.productVariant.update({
              where: { id: variant.id },
              data: { sizeId: variant.sizeId, colorId: variant.colorId, stock: variant.stock },
            })
          : prisma.productVariant.create({
              data: {
                productId: params.id,
                sizeId: variant.sizeId,
                colorId: variant.colorId,
                stock: variant.stock,
              },
            })
      ),
    ]);

    const updated = await prisma.product.findUnique({
      where: { id: params.id },
      include: { images: { orderBy: { position: "asc" } }, variants: true },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Такий SKU або комбінація розмір/колір вже існує" },
        { status: 409 }
      );
    }
    throw error;
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = productPatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некоректні дані", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const product = await prisma.product.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json(product);
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Товар не знайдено" }, { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Товар не знайдено" }, { status: 404 });
    }
    throw error;
  }
}
