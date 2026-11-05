import { z } from "zod";

export const productImageSchema = z.object({
  id: z.string().optional(),
  url: z.string().min(1),
  alt: z.string().optional(),
});

export const productVariantSchema = z.object({
  id: z.string().optional(),
  sizeId: z.string().min(1, "Оберіть розмір"),
  colorId: z.string().min(1, "Оберіть колір"),
  stock: z.number().int().min(0, "Залишок не може бути відʼємним"),
});

export const productFormSchema = z
  .object({
    name: z.string().trim().min(2, "Вкажіть назву"),
    slug: z
      .string()
      .trim()
      .min(2, "Вкажіть slug")
      .regex(/^[a-z0-9-]+$/, "Лише латиниця, цифри й дефіс"),
    sku: z.string().trim().min(1, "Вкажіть артикул"),
    categoryId: z.string().min(1, "Оберіть категорію"),
    price: z.number().positive("Ціна має бути більшою за 0"),
    discountPrice: z.number().positive("Ціна має бути більшою за 0").nullable(),
    fabricComposition: z.string().trim().optional(),
    description: z.string().trim().optional(),
    seoDescription: z.string().trim().optional(),
    isNew: z.boolean(),
    isPromo: z.boolean(),
    isPublished: z.boolean(),
    isFeatured: z.boolean(),
    showOnHomepage: z.boolean(),
    images: z.array(productImageSchema).max(6, "Не більше 6 фото"),
    variants: z
      .array(productVariantSchema)
      .min(1, "Додайте хоча б один варіант (розмір/колір)"),
  })
  .refine(
    (data) => {
      const seen = new Set<string>();
      for (const variant of data.variants) {
        const key = `${variant.sizeId}:${variant.colorId}`;
        if (seen.has(key)) return false;
        seen.add(key);
      }
      return true;
    },
    { message: "Розмір + колір не повинні повторюватись у межах товару", path: ["variants"] }
  );

export type ProductFormValues = z.infer<typeof productFormSchema>;
