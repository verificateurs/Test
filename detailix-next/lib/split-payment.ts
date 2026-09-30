/**
 * Paiement fractionné (3x/4x sans frais) — interface uniquement.
 *
 * Il n'existe aujourd'hui AUCUN compte marchand chez un prestataire de
 * paiement fractionné (type Alma, Oney, Klarna...). Ce module ne fait donc
 * AUCUN appel réseau et n'intègre AUCUN SDK tiers : il se contente de
 * calculer un affichage indicatif ("à partir de X€/mois") derrière un flag
 * désactivé par défaut, prêt à être branché sur un vrai prestataire plus
 * tard.
 *
 * Pour activer l'affichage (une fois qu'un compte prestataire existe et que
 * la vraie intégration est prête) :
 *   - Définir la variable d'environnement PAYMENT_SPLIT_ENABLED="true"
 *     (dans .env / .env.local / les variables d'environnement Vercel).
 *   - Par défaut (variable absente ou toute autre valeur), le flag est
 *     considéré désactivé et rien n'est affiché.
 */

/** Nom de la variable d'environnement contrôlant l'affichage du paiement fractionné. */
export const PAYMENT_SPLIT_ENABLED_ENV_VAR = "PAYMENT_SPLIT_ENABLED";

/**
 * Montant minimum (en euros, TTC) à partir duquel on propose le paiement
 * fractionné. Seuil arbitraire mais raisonnable pour un panier/produit de
 * detailing (évite de proposer un "3x" sur un article à 15€) — à ajuster
 * librement selon les conditions du futur prestataire (Alma/Oney/Klarna
 * imposent en général un plancher similaire, souvent 50€ à 100€).
 */
export const SPLIT_PAYMENT_MIN_AMOUNT_EUR = 100;

/** Nombre d'échéances proposées, sans frais. */
export const SPLIT_PAYMENT_INSTALLMENT_COUNTS = [3, 4] as const;

export function isSplitPaymentEnabled(): boolean {
  return process.env[PAYMENT_SPLIT_ENABLED_ENV_VAR] === "true";
}

export interface InstallmentPlan {
  /** Nombre d'échéances (ex: 3 ou 4). */
  count: number;
  /** Montant de chaque échéance, en centimes. La dernière échéance absorbe l'arrondi. */
  amountPerInstallment: number;
}

/**
 * Contrat neutre côté prestataire de paiement fractionné.
 *
 * À remplacer par une implémentation basée sur le SDK/l'API du prestataire
 * réellement choisi (Alma, Oney, Klarna, etc.) une fois le compte marchand
 * ouvert. L'implémentation par défaut ci-dessous (`DefaultSplitPaymentProvider`)
 * ne fait qu'un calcul arithmétique local, sans appel réseau, sans clé API et
 * sans vérification d'éligibilité réelle — elle sert uniquement à afficher un
 * montant indicatif par échéance.
 */
export interface SplitPaymentProvider {
  /**
   * Calcule les plans d'échéances disponibles pour un montant donné.
   * @param amountCents Montant total TTC, en centimes.
   */
  computeInstallments(amountCents: number): InstallmentPlan[];
}

/**
 * Implémentation par défaut, purement locale : répartit le montant en parts
 * égales (au centime près, la dernière échéance absorbant l'arrondi). Ne
 * représente pas une offre contractuelle réelle et DOIT être remplacée par
 * l'implémentation du prestataire choisi avant toute mise en production
 * effective du paiement fractionné.
 */
export class DefaultSplitPaymentProvider implements SplitPaymentProvider {
  computeInstallments(amountCents: number): InstallmentPlan[] {
    if (!Number.isFinite(amountCents) || amountCents <= 0) return [];

    return SPLIT_PAYMENT_INSTALLMENT_COUNTS.map((count) => ({
      count,
      amountPerInstallment: Math.round(amountCents / count),
    }));
  }
}

export const splitPaymentProvider: SplitPaymentProvider = new DefaultSplitPaymentProvider();

/**
 * Détermine si le badge de paiement fractionné doit être affiché pour un
 * montant donné (en euros, TTC), en tenant compte du flag et du seuil
 * minimum.
 */
export function shouldShowSplitPayment(amountEur: number): boolean {
  return isSplitPaymentEnabled() && amountEur >= SPLIT_PAYMENT_MIN_AMOUNT_EUR;
}
