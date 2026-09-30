import type { CategoryTemplate } from "./types";

// Une pièce de carrosserie (splitter, pare-chocs, capot, kit widebody...)
// épouse la forme de la caisse : sa compatibilité dépend donc du châssis
// (Vehicle.platform, ex "EK", "E36", "FD3S"), pas du moteur qui l'équipe —
// une même caisse peut recevoir plusieurs motorisations différentes tout en
// gardant le même kit carrosserie. compatStrategy "plateforme-plausible" fait
// donc tirer des codes de plateforme réels (data/vehicles.json) au lieu de
// codeMoteur pour tous les BaseNameEntry qui n'imposent pas déjà
// forceUniversel (ex: aileron biplan réglable, cache batterie, ouïes
// d'ailes — accessoires génériques qui ne dépendent pas d'un châssis précis).
export const template: CategoryTemplate = {
  baseNames: [
    { name: "Splitter avant", group: "single" },
    { name: "Diffuseur arrière", group: "single" },
    { name: "Lame de pare-chocs avant", group: "single" },
    { name: "Spoiler de toit", group: "single" },
    { name: "Aileron de coffre", group: "single" },
    { name: "Aileron biplan réglable", group: "single", forceUniversel: true },
    { name: "Capot allégé", group: "single" },
    { name: "Coffre allégé", group: "single" },
    { name: "Grille de calandre sport", group: "single" },
    { name: "Prise d'air de capot", group: "single" },
    { name: "Pare-chocs avant complet", group: "single" },
    { name: "Pare-chocs arrière complet", group: "single" },
    { name: "Jupes latérales", group: "pair" },
    { name: "Canards avant", group: "pair" },
    { name: "Becquet de custode", group: "pair" },
    { name: "Extensions d'ailes", group: "set4" },
    { name: "Élargisseurs d'ailes larges", group: "bigkit" },
    { name: "Kit widebody", group: "bigkit" },
    { name: "Becquet de vitre arrière", group: "single" },
    { name: "Grille de soubassement sport", group: "single" },
    { name: "Protection sous-moteur carbone", group: "single" },
    { name: "Calandre agressive full black", group: "single" },
    { name: "Renfort de bas de caisse structurel", group: "single" },
    { name: "Extension de pare-chocs arrière", group: "single" },
    { name: "Capot carbone ajouré", group: "single" },
    { name: "Hayon carbone allégé", group: "single" },
    { name: "Becquet de lunette arrière", group: "single" },
    { name: "Grille de diffuseur inférieur", group: "single" },
    { name: "Cache batterie carbone", group: "single", forceUniversel: true },
    { name: "Extracteurs d'air d'ailes avant", group: "pair" },
    { name: "Prise d'air latérale", group: "pair" },
    { name: "Ouïes d'ailes latérales", group: "pair", forceUniversel: true },
  ],
  formatVariants: [
    { label: "Pièce unique", sizeMultiplier: 1.0, group: "single" },
    { label: "Jeu de 2", sizeMultiplier: 1.7, group: "pair" },
    { label: "Jeu de 4", sizeMultiplier: 3.0, group: "set4" },
    { label: "Kit 4 pièces", sizeMultiplier: 4.2, group: "bigkit" },
    { label: "Kit complet", sizeMultiplier: 5.5, group: "bigkit" },
  ],
  finishVariants: [
    { label: "ABS prêt à peindre" },
    { label: "Carbone gloss", multiplier: 1.6 },
    { label: "Carbone matte", multiplier: 1.55 },
  ],
  descriptionOpeners: [
    "Pièce carrosserie aftermarket conçue pour accentuer le caractère sportif du véhicule.",
    "Élément aérodynamique développé pour un montage sans modification irréversible du véhicule.",
    "Pièce esthétique pensée pour compléter une préparation extérieure complète.",
    "Élément de style conçu pour s'intégrer aux lignes d'origine sans les dénaturer.",
    "Pièce destinée à un montage assisté par un carrossier pour un résultat optimal.",
    "Conçu pour un usage route comme piste selon le niveau de préparation recherché.",
    "Pièce carrosserie sélectionnée pour sa fidélité aux lignes du véhicule d'origine.",
    "Élément aérodynamique conçu pour renforcer la présence visuelle du véhicule sur route comme en exposition.",
  ],
  descriptionBenefits: [
    "Améliore l'appui aérodynamique et l'esthétique générale du véhicule à haute vitesse.",
    "Affirme visuellement le caractère sportif de la préparation sans compromettre l'usage quotidien.",
    "Allège l'ensemble par rapport à la pièce d'origine tout en conservant la rigidité nécessaire.",
    "Permet un montage précis grâce à une visserie et des clips dédiés fournis.",
    "Offre un ajustement fidèle aux lignes d'origine du modèle ciblé.",
    "Apporte une touche de personnalisation visible sans alourdir la préparation existante.",
    "Renforce la cohérence visuelle de l'ensemble de la préparation extérieure du véhicule.",
    "Facilite l'intégration avec les autres éléments de carrosserie déjà montés sur le véhicule.",
  ],
  descriptionClosers: [
    "Montage recommandé par un professionnel pour un ajustement optimal.",
    "Pièce livrée brute, prête à peindre ou à recouvrir selon la finition choisie.",
    "Compatible avec un usage route ouverte comme avec une préparation circuit.",
    "Un ajustement fin sur le véhicule reste conseillé avant fixation définitive.",
    "Complète efficacement une préparation esthétique et aérodynamique cohérente.",
    "Un choix apprécié des passionnés pour affirmer un style show ou compétition.",
    "Une pièce qui s'intègre naturellement à une préparation esthétique déjà engagée.",
    "Recommandé pour parachever une préparation extérieure cohérente du splitter à l'aileron.",
  ],
  priceRangeHT: [140, 900],
  compatStrategy: "plateforme-plausible",
  variantsPerBrandTarget: 32,
};
