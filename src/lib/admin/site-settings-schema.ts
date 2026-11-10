import { z } from "zod";

export const siteSettingsFormSchema = z.object({
  heroImageUrl: z.string().trim().nullable(),
  heroImageAlt: z.string().trim().optional(),
  seasonalLabel: z.string().trim().min(1, "Вкажіть назву колекції"),
  seasonalCategoryId: z.string().trim().nullable(),
});

export type SiteSettingsFormValues = z.infer<typeof siteSettingsFormSchema>;
