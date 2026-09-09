import { z } from "zod";

export const ProductFormSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(160),
  format: z.string().trim().min(1, "Format requis").max(80),
  description: z.string().trim().min(1, "Description requise").max(2000),
  prixAchat: z.coerce.number().positive("Le prix d'achat doit être positif"),
  stockQty: z.coerce.number().int("Nombre entier requis").min(0, "La quantité en stock ne peut pas être négative"),
  compatibiliteType: z.enum(["universel", "codesMoteurs"]),
  compatibiliteCodes: z.string().trim().max(2000).optional().default(""),
  homologation: z.enum(["", "route-ouverte", "usage-piste"]).optional().default(""),
  brandId: z.string().trim().min(1, "Marque requise"),
  categoryId: z.string().trim().min(1, "Catégorie requise"),
});

export type ProductFormValues = z.infer<typeof ProductFormSchema>;

export function buildCompatibilite(values: Pick<ProductFormValues, "compatibiliteType" | "compatibiliteCodes">): string {
  if (values.compatibiliteType === "universel") return "universel";
  const codes = values.compatibiliteCodes
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  return JSON.stringify({ type: "codesMoteurs", codes });
}
