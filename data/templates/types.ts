// Types partagés par les 10 templates de génération procédurale de produits
// (data/templates/<categoryId>.ts), consommés par data/generate-products.ts.

/** Familles de motorisations retenues pour le tirage "moteur-plausible". */
export type MotorProfile = "turbo-petrol" | "atmo" | "any-performance";

export interface BaseNameEntry {
  /** Nom affiché du produit (générique, sans référence de gamme/finition). */
  name: string;
  /**
   * Tag de regroupement optionnel utilisé pour restreindre les formatVariants
   * et finishVariants compatibles (ex: un "nettoyant jantes" liquide ne doit
   * pas recevoir le format "Jeu de 4" ni une finition "Titane").
   * Si absent, tous les formatVariants/finishVariants du template s'appliquent.
   */
  group?: string;
  /** Force compatibilite universelle quel que soit compatStrategy/format. */
  forceUniversel?: boolean;
  /** Famille de motorisation plausible pour ce produit (catégories moteur-plausible). */
  motorProfile?: MotorProfile;
  /** Désactive le tirage d'une finition pour ce produit même si le template en propose. */
  noFinish?: boolean;
  /**
   * Restreint les marques éligibles à ce produit à celles listées (par id,
   * cf. data/brands.json) lorsque le nom du produit renvoie à un type de
   * pièce que seules certaines marques réelles fabriquent effectivement
   * (ex: NGK fait des bougies/bobines, pas BMC ni Eventuri). Si absent,
   * toutes les marques de la catégorie restent éligibles pour ce produit —
   * réservé aux catégories où toutes les marques vendent des types de
   * produits suffisamment proches pour ne pas nécessiter cette contrainte
   * (voir le commentaire en tête de data/generate-products.ts).
   */
  eligibleBrandIds?: string[];
}

export interface FormatVariant {
  label: string;
  /** Multiplicateur de prix relatif au format de référence (1.0). */
  sizeMultiplier: number;
  /**
   * Force un mode de compatibilité pour ce format précis (ex: rouleau de
   * covering = toujours universel ; kit de covering découpe sur mesure =
   * toujours lié à une plateforme/châssis précis).
   */
  compat?: "universel" | "codesMoteurs" | "plateformes";
  /** Doit correspondre au group du BaseNameEntry pour être éligible (sinon toujours éligible). */
  group?: string;
}

export interface FinishVariant {
  label: string;
  /** Multiplicateur de prix additionnel, défaut 1. */
  multiplier?: number;
}

export interface CategoryTemplate {
  baseNames: BaseNameEntry[];
  formatVariants: FormatVariant[];
  finishVariants?: FinishVariant[];
  descriptionOpeners: string[];
  descriptionBenefits: string[];
  descriptionClosers: string[];
  /** [min, max] prixAchat HT de référence (gamme "Milieu de gamme", format sizeMultiplier=1). */
  priceRangeHT: [number, number];
  /**
   * Stratégie de compatibilité par défaut de la catégorie (utilisée quand ni
   * le BaseNameEntry ni le FormatVariant ne forcent explicitement un mode) :
   * - "universel" : compatible avec tous les véhicules.
   * - "moteur-plausible" : lié à un ou plusieurs codeMoteur plausibles
   *   (cf. BaseNameEntry.motorProfile) — pour les pièces dont la
   *   compatibilité dépend de la motorisation (admission, échappement...).
   * - "plateforme-plausible" : lié à une ou plusieurs plateformes/châssis
   *   réels (cf. Vehicle.platform dans data/vehicles.json) — pour les
   *   pièces dont la compatibilité dépend de la forme de la caisse et non
   *   du moteur (kits carrosserie, films de covering découpés sur mesure).
   */
  compatStrategy: "universel" | "moteur-plausible" | "plateforme-plausible";
  /** Cible indicative de variantes par marque (le script clamp selon le pool réellement disponible). */
  variantsPerBrandTarget: number;
}
