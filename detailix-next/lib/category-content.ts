/**
 * Contenu éditorial dédié par catégorie, affiché en tête de `app/categories/[id]/page.tsx`
 * en complément de `Category.description` (qui reste utilisée comme fallback et pour le
 * `<meta description>` via `generateMetadata`). Un texte factuel et utile, pas une accroche
 * marketing creuse — pas de promesse de gain non vérifiable ni de superlatif gratuit.
 */
export interface CategoryContent {
  tagline: string;
  intro: string;
}

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  "preparation-moteur": {
    tagline: "Reprogrammation, admission, échappement et refroidissement : préparer un moteur sans deviner",
    intro:
      "La préparation moteur regroupe les pièces et prestations qui modifient les réglages ou le flux d'air/carburant d'un moteur : reprogrammation, filtres à air performance, échappements, intercoolers, bougies renforcées. Les gains réels dépendent toujours du véhicule précis et de son état — sélectionnez votre véhicule pour voir les packs Stage 1/2/3 disponibles pour votre motorisation, avec leurs gains indicatifs et leur statut d'homologation.",
  },
  "entretien-moteur": {
    tagline: "Huiles, additifs et nettoyants pour préserver la mécanique dans la durée",
    intro:
      "L'entretien moteur couvre les produits consommables de maintenance régulière : huiles moteur, additifs carburant, nettoyants injecteurs, produits de rinçage circuit. Contrairement à la préparation moteur, ces produits ne modifient pas les performances d'origine — ils visent à maintenir le moteur dans les conditions prévues par le constructeur.",
  },
  "cosmetique-carrosserie": {
    tagline: "Shampoings, cires et produits d'entretien extérieur",
    intro:
      "Les produits de cosmétique carrosserie couvrent le lavage, la protection et la finition de la peinture : shampoings, cires, quick detailers et produits pour plastiques extérieurs. Le choix dépend surtout de l'état de la peinture et de la fréquence d'entretien souhaitée plutôt que du véhicule.",
  },
  "echappement-sport": {
    tagline: "Lignes complètes et silencieux sport, avec impact sur le son et parfois la puissance",
    intro:
      "Un échappement sport modifie la sonorité et, selon la conception, peut réduire la contre-pression et gagner quelques chevaux en haut régime. Certaines références sont homologuées route ouverte, d'autres réservées à un usage piste — vérifiez systématiquement l'homologation affichée sur la fiche produit avant tout montage sur un véhicule circulant sur route ouverte.",
  },
  "eclairage": {
    tagline: "Ampoules LED, feux et phares pour remplacer ou moderniser l'éclairage d'origine",
    intro:
      "L'éclairage regroupe les ampoules LED de remplacement, feux additionnels et blocs optiques. La compatibilité avec le culot et le circuit électrique d'origine du véhicule est déterminante — les fiches produit indiquent les codes moteur ou modèles compatibles quand l'information est disponible.",
  },
  "jantes-pneus": {
    tagline: "Jantes, produits de nettoyage roues et accessoires de montage",
    intro:
      "Cette catégorie couvre les jantes elles-mêmes ainsi que les produits d'entretien (nettoyants jantes, protections) et accessoires de montage (boulonnerie, centrages). Le diamètre, l'entraxe et le déport doivent correspondre exactement au véhicule — un mauvais choix n'est pas seulement inesthétique, il peut être dangereux.",
  },
  "kits-carrosserie": {
    tagline: "Pare-chocs, jupes, ailerons et éléments de style extérieur",
    intro:
      "Les kits carrosserie modifient l'apparence extérieure du véhicule : pare-chocs, jupes latérales, diffuseurs, ailerons. Ces pièces sont généralement spécifiques à un modèle précis, parfois à une génération ou une motorisation donnée — vérifiez la compatibilité affichée sur chaque fiche avant commande.",
  },
  "outils-detailing": {
    tagline: "Polisseuses, nettoyeurs et outillage professionnel pour l'entretien esthétique",
    intro:
      "Les outils et équipements de détailing (polisseuses, nettoyeurs haute pression, aspirateurs, accessoires) sont utilisables sur tout véhicule — ce ne sont pas des pièces montées mais du matériel d'entretien, à choisir selon l'usage (particulier occasionnel ou professionnel régulier).",
  },
  "polish-protection-ceramique": {
    tagline: "Polish, traitements céramiques et protections longue durée de la peinture",
    intro:
      "Cette catégorie regroupe les produits de correction de peinture (polish, compounds) et les protections longue durée (céramiques, scellants). Le résultat dépend fortement de la méthode d'application — ces produits demandent généralement plus de rigueur qu'une cire classique mais offrent une tenue nettement supérieure.",
  },
  "covering-vitres-teintees": {
    tagline: "Films de covering et vitres teintées pour l'extérieur du véhicule",
    intro:
      "Le covering (films adhésifs de carrosserie) et les vitres teintées modifient l'apparence du véhicule sans intervention sur la peinture d'origine. La réglementation sur le taux de teinte des vitres avant varie selon les pays et usages — vérifiez la législation applicable avant installation.",
  },
};
