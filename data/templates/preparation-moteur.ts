import type { CategoryTemplate } from "./types";

// ─── Plausibilité marque × produit ─────────────────────────────────────────
// Les 13 marques de cette catégorie (data/brands.json) sont des spécialistes
// réels qui ne fabriquent chacun qu'un sous-ensemble des types de pièces du
// catalogue préparation moteur (ex: NGK fait des bougies/bobines, pas des
// kits d'admission carbone ; Walbro fait des pompes à carburant, pas des
// turbos). Sans contrainte, le générateur associait n'importe quel produit à
// n'importe quelle marque de la catégorie (cf. bug QA : bobines d'allumage
// vendues sous BMC/COBB/DeatschWerks/Eventuri). eligibleBrandIds restreint
// donc, pour CHAQUE BaseNameEntry de cette catégorie, la liste des ids de
// marques plausibles d'après leur activité réelle (voir data/brands.json
// pour la description de chaque marque). Toutes les autres catégories ont
// des marques suffisamment homogènes (ex: toutes des marques de chimie
// carrosserie) pour ne pas avoir besoin de cette contrainte.
const KN = "k-n";
const BMC = "bmc-filter";
const FORGE = "forge-motorsport";
const MISHIMOTO = "mishimoto";
const WAGNER = "wagner-tuning";
const APR = "apr";
const HKS = "hks";
const WALBRO = "walbro";
const DEATSCHWERKS = "deatschwerks";
const NGK = "ngk";
const EVENTURI = "eventuri";
const COBB = "cobb-tuning";
const GARRETT = "garrett";

export const template: CategoryTemplate = {
  baseNames: [
    { name: "Filtre à air sport lavable", group: "part", motorProfile: "any-performance", eligibleBrandIds: [KN, BMC] },
    { name: "Kit admission directe carbone", group: "part", motorProfile: "turbo-petrol", eligibleBrandIds: [KN, BMC, EVENTURI, APR, HKS] },
    { name: "Dump valve de décharge turbo", group: "part", motorProfile: "turbo-petrol", eligibleBrandIds: [FORGE, HKS] },
    { name: "Intercooler frontal performance", group: "part", motorProfile: "turbo-petrol", eligibleBrandIds: [FORGE, MISHIMOTO, WAGNER, APR, HKS] },
    { name: "Kit pipes aluminium renforcées", group: "part", motorProfile: "turbo-petrol", eligibleBrandIds: [FORGE, WAGNER, MISHIMOTO] },
    { name: "Radiateur aluminium haute capacité", group: "part", motorProfile: "any-performance", eligibleBrandIds: [MISHIMOTO, FORGE] },
    { name: "Refroidisseur d'huile", group: "part", forceUniversel: true, eligibleBrandIds: [MISHIMOTO, FORGE] },
    { name: "Turbine turbo compétition", group: "part", motorProfile: "turbo-petrol", eligibleBrandIds: [GARRETT, HKS] },
    { name: "Pompe à carburant haute pression", group: "part", forceUniversel: true, eligibleBrandIds: [WALBRO, DEATSCHWERKS] },
    { name: "Short shifter court", group: "part", motorProfile: "any-performance", eligibleBrandIds: [HKS] },
    { name: "Silencieux d'admission compétition", group: "part", motorProfile: "turbo-petrol", eligibleBrandIds: [KN, BMC, HKS] },
    { name: "Kit durites silicone renforcées", group: "part", motorProfile: "any-performance", eligibleBrandIds: [FORGE, MISHIMOTO, WAGNER] },
    { name: "Conduite d'huile turbo renforcée", group: "part", motorProfile: "turbo-petrol", eligibleBrandIds: [FORGE, HKS] },
    { name: "Plaque de sous-caisse allégée", group: "part", motorProfile: "any-performance", eligibleBrandIds: [MISHIMOTO, FORGE] },
    { name: "Filtre conique universel", group: "filter", forceUniversel: true, noFinish: true, eligibleBrandIds: [KN, BMC] },
    { name: "Jeu d'injecteurs gros débit", group: "set4", motorProfile: "any-performance", eligibleBrandIds: [DEATSCHWERKS, WALBRO] },
    { name: "Bougies d'allumage iridium", group: "set4", motorProfile: "any-performance", eligibleBrandIds: [NGK] },
    { name: "Bobines d'allumage renforcées", group: "set4", motorProfile: "any-performance", eligibleBrandIds: [NGK] },
    { name: "Reprogrammation ECU Stage 1", group: "ecu", motorProfile: "any-performance", noFinish: true, eligibleBrandIds: [APR, COBB, HKS] },
    { name: "Reprogrammation ECU Stage 2", group: "ecu", motorProfile: "turbo-petrol", noFinish: true, eligibleBrandIds: [APR, COBB] },
    { name: "Boîtier additionnel piggyback", group: "ecu", motorProfile: "turbo-petrol", noFinish: true, eligibleBrandIds: [COBB, HKS] },
  ],
  formatVariants: [
    { label: "Pièce unique", sizeMultiplier: 1.0, group: "part" },
    { label: "Kit complet", sizeMultiplier: 1.65, group: "part" },
    { label: "Jeu de 4", sizeMultiplier: 1.0, group: "set4" },
    { label: "Prestation (port OBDII)", sizeMultiplier: 1.0, group: "ecu" },
    { label: "Boîtier OBDII", sizeMultiplier: 2.5, group: "ecu" },
    { label: "Filtre Ø63mm", sizeMultiplier: 0.55, group: "filter" },
    { label: "Filtre Ø70mm", sizeMultiplier: 0.65, group: "filter" },
    { label: "Filtre Ø76mm", sizeMultiplier: 0.8, group: "filter" },
  ],
  finishVariants: [
    { label: "Standard préparation" },
    { label: "Grade compétition", multiplier: 1.25 },
  ],
  descriptionOpeners: [
    "Pièce de préparation moteur conçue pour un gain mesurable sur banc de puissance.",
    "Élément développé pour accompagner une préparation moteur du Stage 1 à la compétition.",
    "Pièce fabriquée pour supporter un usage moteur préparé sans compromettre la fiabilité.",
    "Élément conçu pour optimiser un paramètre clé de la chaîne d'admission ou d'échappement moteur.",
    "Pièce pensée pour un montage plug-and-play sur la majorité des motorisations concernées.",
    "Conçu pour les préparateurs recherchant un gain constant et documenté au banc.",
    "Pièce sélectionnée pour sa fiabilité éprouvée dans les préparations moteur les plus exigeantes.",
    "Élément conçu pour accompagner une montée en puissance progressive et maîtrisée du moteur.",
  ],
  descriptionBenefits: [
    "Améliore le débit d'air ou de carburant pour exploiter tout le potentiel de la préparation.",
    "Réduit la température ou la pression dans la chaîne moteur pour une fiabilité accrue en usage intensif.",
    "Accentue la réponse moteur perçue à l'accélération sans compromettre le confort d'usage quotidien.",
    "Garantit une alimentation stable même en pleine charge lors de sessions piste prolongées.",
    "Complète efficacement une reprogrammation ECU en assurant la fiabilité mécanique associée.",
    "Offre une marge de sécurité supplémentaire pour les préparations dépassant les réglages d'origine.",
    "Contribue à la constance des performances moteur sur des sessions prolongées en usage intensif.",
    "Facilite le diagnostic et l'entretien de la chaîne moteur préparée grâce à un montage accessible.",
  ],
  descriptionClosers: [
    "Montage recommandé par un professionnel avec passage au banc pour valider le comportement moteur.",
    "Compatible avec la majorité des préparations Stage 1 à Stage 3 selon la base moteur retenue.",
    "Livré avec la documentation nécessaire à une installation guidée.",
    "Un choix éprouvé par les préparateurs pour sa fiabilité en usage circuit prolongé.",
    "Garantie fabricant incluse sur les défauts de matière et de fabrication.",
    "Idéal en complément d'un kit d'admission ou d'une ligne d'échappement sport.",
    "Une pièce reconnue pour accompagner durablement une préparation moteur évolutive.",
    "Conçu pour s'intégrer naturellement à une préparation moteur déjà engagée vers un niveau supérieur.",
  ],
  priceRangeHT: [55, 950],
  compatStrategy: "moteur-plausible",
  variantsPerBrandTarget: 22,
};
