import { z } from "zod";

export const BrandFormSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(120),
  origine: z.string().trim().min(1, "Origine requise").max(80),
  gamme: z.string().trim().min(1, "Gamme requise").max(80),
  rating: z.coerce.number().min(0).max(5),
  reviewCount: z.coerce.number().int().min(0),
  recommended: z.coerce.boolean(),
  preference: z.string().trim().min(1, "Description de préférence requise").max(500),
  categoryId: z.string().trim().min(1, "Catégorie requise"),
});

export type BrandFormValues = z.infer<typeof BrandFormSchema>;
