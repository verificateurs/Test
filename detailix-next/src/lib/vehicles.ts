import { getVehicleModels, getProductsForModel } from "@/lib/catalogue";

export type VehiclePage = {
  slug: string; // makeId-modelId, ex. "volkswagen-golf-7"
  makeId: string;
  makeName: string;
  modelId: string;
  modelName: string;
  codesMoteur: string[];
  motorisations: { label: string; codeMoteur: string }[];
  productIds: string[];
  /** true si un autre modèle, traité avant, expose exactement les mêmes produits.
   *  On garde la page (utile à l'internaute) mais on la met en noindex pour ne
   *  pas créer de contenu dupliqué (doorway page sanctionnée par Google). */
  isDuplicate: boolean;
};

/**
 * Construit la liste des pages véhicule.
 *
 * Deux modèles peuvent partager des codes moteur (Golf 8 et Audi A3 : DTSA,
 * DPCA) et donc lister exactement les mêmes produits. Le premier rencontré est
 * canonique ; les suivants à ensemble de produits identique sont marqués
 * doublons. Les modèles sans aucun produit compatible sont écartés (une page
 * long-tail vide nuit plus qu'elle ne rapporte).
 */
export async function getVehiclePages(): Promise<VehiclePage[]> {
  const models = await getVehicleModels();
  const pages: VehiclePage[] = [];
  const seenProductSets = new Map<string, string>(); // signature -> slug canonique

  // Ordre stable : par marque puis modèle, pour que "le premier" soit déterministe.
  models.sort((a, b) => (a.makeId + a.id).localeCompare(b.makeId + b.id));

  for (const model of models) {
    const codesMoteur = [...new Set(model.motorisations.map((m) => m.codeMoteur))];
    const products = await getProductsForModel(codesMoteur);
    if (products.length === 0) continue; // pas de page véhicule vide

    const productIds = products.map((p) => p.id).sort();
    const signature = productIds.join("|");
    const isDuplicate = seenProductSets.has(signature);
    if (!isDuplicate) seenProductSets.set(signature, `${model.makeId}-${model.id}`);

    pages.push({
      slug: `${model.makeId}-${model.id}`,
      makeId: model.makeId,
      makeName: model.make.name,
      modelId: model.id,
      modelName: model.name,
      codesMoteur,
      motorisations: model.motorisations.map((m) => ({ label: m.label, codeMoteur: m.codeMoteur })),
      productIds,
      isDuplicate,
    });
  }

  return pages;
}

export async function getVehiclePage(slug: string): Promise<VehiclePage | null> {
  const pages = await getVehiclePages();
  return pages.find((p) => p.slug === slug) ?? null;
}
