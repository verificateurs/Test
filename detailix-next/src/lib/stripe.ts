import "server-only";
import Stripe from "stripe";

/**
 * Client Stripe optionnel : sans STRIPE_SECRET_KEY, le site reste utilisable
 * en mode démonstration (voir src/app/commande/actions.ts). Ne jamais
 * importer ce module depuis un composant client — la clé secrète ne doit
 * jamais atteindre le bundle navigateur.
 */
let client: Stripe | null | undefined;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripeClient(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY absent — appeler isStripeConfigured() avant getStripeClient().");
  client = new Stripe(key);
  return client;
}
