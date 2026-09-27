// Types partagés par les 9 templates de génération procédurale de produits
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
}

export interface FormatVariant {
  label: string;
  /** Multiplicateur de prix relatif au format de référence (1.0). */
  sizeMultiplier: number;
  /** Force universel/codesMoteurs pour ce format précis (ex: rouleau = toujours universel). */
  compat?: "universel" | "codesMoteurs";
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
  compatStrategy: "universel" | "moteur-plausible";
  /** Cible indicative de variantes par marque (le script clamp selon le pool réellement disponible). */
  variantsPerBrandTarget: number;
}
