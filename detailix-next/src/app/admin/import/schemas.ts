import { z } from "zod";

// Mêmes règles que tools/validate-catalogue.js (site vanilla), portées ici
// pour l'import back-office. .strict() sur chaque objet : un import ne doit
// JAMAIS pouvoir écrire un champ hors de cette liste explicite (a fortiori
// pas Setting, Role ou User — ce endpoint ne touche que le modèle Product).
const KEBAB_CASE = /^[a-z0-9]+(?:[-.][a-z0-9]+)*$/;

const CompatibiliteSchema = z.union([
  z.literal("universel"),
  z.object({ type: z.literal("codesMoteurs"), codes: z.array(z.string().trim().min(1).max(40)).min(1) }).strict(),
]);

export const ProductImportSchema = z
  .object({
    id: z.string().regex(KEBAB_CASE, "id doit être en kebab-case"),
    name: z.string().trim().min(1).max(200),
    format: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(2000),
    prixAchat: z.number().min(0).max(100000),
    stock: z.boolean(),
    compatibilite: CompatibiliteSchema,
    homologation: z.enum(["route-ouverte", "usage-piste"]).nullable().optional(),
    brandId: z.string().min(1),
    categoryId: z.string().min(1),
  })
  .strict();

export const ImportPayloadSchema = z
  .object({
    products: z.array(ProductImportSchema).min(1).max(5000),
  })
  .strict();

export type ProductImport = z.infer<typeof ProductImportSchema>;
