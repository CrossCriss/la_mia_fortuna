import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Вкажіть назву"),
  slug: z
    .string()
    .trim()
    .min(2, "Вкажіть slug")
    .regex(/^[a-z0-9-]+$/, "Лише латиниця, цифри й дефіс"),
  parentId: z.string().min(1).nullable(),
  kind: z.enum(["REGULAR", "NEW_ARRIVALS", "PROMO"]),
  sortOrder: z.coerce.number().int().default(0),
  isVisible: z.boolean().default(true),
  isFeaturedOnHome: z.boolean().default(false),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
