import type { CategoryTemplate } from "./types";

// Un film/PPF "kit découpe sur mesure" est prédécoupé pour épouser la forme
// d'un élément de carrosserie précis (capot, toit, pare-chocs...) : sa
// compatibilité dépend donc du châssis (Vehicle.platform), pas du moteur —
// d'où formatVariants "kit" en compat "plateformes" ci-dessous. Les rouleaux
// bruts (non découpés) et l'outillage de pose restent "universel" : ils ne
// sont liés à aucun véhicule précis.
export const template: CategoryTemplate = {
  baseNames: [
    { name: "Film de covering cast (rouleau)", group: "roll" },
    { name: "Film de covering calandré (rouleau)", group: "roll" },
    { name: "PPF protection peinture (rouleau)", group: "roll", forceUniversel: true, noFinish: true },
    { name: "PPF anti-gravillons haute épaisseur (rouleau)", group: "roll", forceUniversel: true, noFinish: true },
    { name: "Film teinte vitrage avant conforme", group: "kit", noFinish: true },
    { name: "Film teinte vitrage complet", group: "kit", noFinish: true },
    { name: "PPF capot et boucliers (kit découpe)", group: "kit", noFinish: true },
    { name: "PPF intégral carrosserie (kit découpe)", group: "kit", noFinish: true },
    { name: "Film de protection phares (kit découpe)", group: "kit", noFinish: true },
    { name: "Film covering toit (kit découpe)", group: "kit" },
    { name: "Film covering rétroviseurs (kit découpe)", group: "kit" },
    { name: "Film anti-gravillons bas de caisse (kit découpe)", group: "kit", noFinish: true },
    { name: "Film covering montants de toit (kit découpe)", group: "kit" },
    { name: "Film covering poignées de portes (kit découpe)", group: "kit" },
    { name: "Outillage de pose (racle + cutter)", group: "tool", forceUniversel: true, noFinish: true },
    { name: "Primer d'adhérence covering", group: "tool", forceUniversel: true, noFinish: true },
    { name: "Solution de pose humide (spray)", group: "tool", forceUniversel: true, noFinish: true },
    { name: "Film covering bas de pare-chocs (kit découpe)", group: "kit", noFinish: true },
    { name: "Film covering calandre (kit découpe)", group: "kit", noFinish: true },
    { name: "Film teinte lunette arrière (kit)", group: "kit", noFinish: true },
    { name: "Film teinte custode arrière (kit)", group: "kit", noFinish: true },
    { name: "PPF jantes (kit découpe)", group: "kit", forceUniversel: true, noFinish: true },
    { name: "PPF seuils de porte (kit découpe)", group: "kit", noFinish: true },
    { name: "Film covering plage arrière (kit découpe)", group: "kit" },
    { name: "Film covering tableau de bord (kit découpe)", group: "kit" },
    { name: "Kit de nettoyage pré-pose vitrage", group: "tool", forceUniversel: true, noFinish: true },
    { name: "Raclette de pose professionnelle", group: "hardware", forceUniversel: true, noFinish: true },
    { name: "Cutter de précision lame céramique", group: "hardware", forceUniversel: true, noFinish: true },
    { name: "Pistolet thermique professionnel pose", group: "hardware", forceUniversel: true, noFinish: true },
    { name: "Gants anti-traces pose covering", group: "hardware", forceUniversel: true, noFinish: true },
    { name: "Bande de masquage précision pose", group: "hardware", forceUniversel: true, noFinish: true },
    { name: "Aimants de maintien film pose", group: "hardware", forceUniversel: true, noFinish: true },
  ],
  formatVariants: [
    { label: "Rouleau 1,52 x 5 m", sizeMultiplier: 1.0, compat: "universel", group: "roll" },
    { label: "Rouleau 1,52 x 10 m", sizeMultiplier: 1.85, compat: "universel", group: "roll" },
    { label: "Rouleau 0,61 x 4,5 m", sizeMultiplier: 1.15, compat: "universel", group: "roll" },
    { label: "Kit véhicule complet", sizeMultiplier: 2.6, compat: "plateformes", group: "kit" },
    { label: "Kit avant", sizeMultiplier: 0.9, compat: "plateformes", group: "kit" },
    { label: "Kit découpe sur mesure", sizeMultiplier: 2.2, compat: "plateformes", group: "kit" },
    { label: "Flacon 500 ml", sizeMultiplier: 0.35, compat: "universel", group: "tool" },
    { label: "Outil seul", sizeMultiplier: 0.5, compat: "universel", group: "tool" },
    { label: "Outil seul", sizeMultiplier: 0.5, compat: "universel", group: "hardware" },
  ],
  finishVariants: [
    { label: "Gloss" },
    { label: "Satin" },
    { label: "Mat", multiplier: 1.05 },
    { label: "Chrome", multiplier: 1.5 },
  ],
  descriptionOpeners: [
    "Film pensé pour une pose à froid sur formes complexes sans marquage résiduel.",
    "Solution de protection ou de personnalisation développée pour un usage extérieur intensif.",
    "Film conçu pour un rendu proche de la peinture d'origine après pose professionnelle.",
    "Solution technique pensée pour une découpe sur mesure adaptée à chaque véhicule.",
    "Film développé pour résister durablement aux lavages haute pression et aux UV.",
    "Conçu pour une pose repositionnable facilitant l'ajustement avant marouflage définitif.",
    "Film sélectionné pour sa capacité à épouser les formes les plus exigeantes de la carrosserie.",
    "Solution de protection conçue pour préserver durablement l'aspect esthétique du véhicule.",
  ],
  descriptionBenefits: [
    "Protège durablement la surface d'origine contre les impacts, rayures et projections routières.",
    "Offre un rendu visuel homogène sans bulles grâce à une technologie de pose facilitée.",
    "Conserve ses propriétés outdoor plusieurs années sans jaunissement ni décollement.",
    "Facilite le conformage sur les courbures complexes de carrosserie sans surchauffe excessive.",
    "Réduit la transmission thermique et la luminosité selon le niveau de teinte choisi.",
    "Préserve la valeur de revente en protégeant la peinture d'origine du véhicule.",
    "Simplifie l'entretien courant de la carrosserie en limitant l'adhérence des salissures et insectes.",
    "Renforce la discrétion visuelle de l'habitacle tout en conservant une bonne visibilité de conduite.",
  ],
  descriptionClosers: [
    "Pose recommandée par un installateur certifié pour un résultat garanti sans défaut.",
    "Conforme à la réglementation française en vigueur sur les niveaux de transmission lumineuse.",
    "Garantie constructeur disponible selon le réseau d'installation choisi.",
    "Un nettoyage complet de la surface est requis avant application.",
    "Compatible avec un usage quotidien comme avec une préparation avant revente.",
    "Un choix reconnu des professionnels du covering et de la protection carrosserie.",
    "Une solution durable pour préserver l'esthétique et la valeur du véhicule dans le temps.",
    "Pensé pour accompagner aussi bien une protection ponctuelle qu'une personnalisation complète.",
  ],
  priceRangeHT: [70, 340],
  // Jamais atteint en pratique : chaque FormatVariant force déjà un mode
  // ("universel" pour roll/tool/hardware, "plateformes" pour kit) — gardé à
  // "plateforme-plausible" par cohérence documentaire avec le reste de la
  // catégorie plutôt que "moteur-plausible", qui ne serait plus pertinent.
  compatStrategy: "plateforme-plausible",
  variantsPerBrandTarget: 32,
};
