import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Вкажіть назву"),
  // Slug більше не вводиться вручну — генерується на сервері з назви
  // категорії (див. /api/admin/categories), як і для товарів.
  slug: z.string().trim().optional(),
  parentId: z.string().min(1).nullable(),
  kind: z.enum(["REGULAR", "NEW_ARRIVALS", "PROMO"]),
  sortOrder: z.coerce.number().int().default(0),
  isVisible: z.boolean().default(true),
  isFeaturedOnHome: z.boolean().default(false),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
