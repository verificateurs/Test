import { z } from "zod";

/**
 * Le panier transite du client vers le serveur uniquement comme une liste
 * (productId, qty) — jamais de prix. createOrderAction() recalcule chaque
 * montant depuis la base ; ce schéma ne valide que la forme des données.
 */
export const CartItemInputSchema = z.object({
  productId: z.string().min(1).max(200),
  qty: z.number().int().min(1).max(99),
});

export const CartItemsInputSchema = z.array(CartItemInputSchema).min(1, "Le panier est vide").max(50);

// Code postal français à 5 chiffres — le site ne livre qu'en France pour ce lot.
const ZIP_RE = /^[0-9]{5}$/;

export const CheckoutSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse email invalide"),
  shippingName: z.string().trim().min(1, "Nom requis").max(120),
  shippingAddr: z.string().trim().min(1, "Adresse requise").max(200),
  shippingZip: z.string().trim().regex(ZIP_RE, "Code postal invalide (5 chiffres)"),
  shippingCity: z.string().trim().min(1, "Ville requise").max(120),
  promoCode: z
    .string()
    .trim()
    .toUpperCase()
    .max(40)
    .optional()
    .transform((v) => (v ? v : undefined)),
});
