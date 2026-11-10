import { z } from "zod";

export const colorFormSchema = z.object({
  name: z.string().trim().min(1, "Вкажіть назву кольору"),
  hex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Колір обирається через палітру"),
});

export type ColorFormValues = z.infer<typeof colorFormSchema>;
