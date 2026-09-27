/**
 * Génère data/stage-packs.json : des packs de préparation moteur (Stage 1/2/3)
 * rattachés à chaque codeMoteur pertinent de data/vehicles.json, avec des gains
 * indicatifs (CH/Nm/conso) et une liste de produits inclus tirée de
 * data/products.json (catégories preparation-moteur / echappement-sport /
 * entretien-moteur déjà compatibles avec ce codeMoteur).
 *
 * ⚠️ Les gains affichés sont des ESTIMATIONS de gamme, pas des mesures banc
 * garanties — ils dépendent du véhicule réel. Chaque pack reste `usage_piste`
 * (jamais `route_ouverte`) : une reprogrammation moteur non réceptionnée sort
 * du cadre d'homologation d'origine, quel que soit le stage.
 *
 * Idempotent : les ids générés sont déterministes (`${codeMoteur}-stage${n}`).
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ROOT = __dirname;

function loadJson(name: string) {
  return JSON.parse(readFileSync(join(ROOT, name), "utf8"));
}

interface Motorisation {
  id: string;
  label: string;
  codeMoteur: string;
  anneeDebut?: number | null;
  anneeFin?: number | null;
  carburant?: "essence" | "diesel" | "hybride" | "electrique" | null;
  cylindreeCm3?: number | null;
  puissanceOrigineCh?: number | null;
  coupleOrigineNm?: number | null;
  consoOrigineL100?: number | null;
}

interface ProductCompat {
  type: "universel" | "codesMoteurs";
  codes?: string[];
}

interface ProductEntry {
  id: string;
  categoryId: string;
  name: string;
  compatibilite: ProductCompat | string;
}

function isCompatible(p: ProductEntry, codeMoteur: string): boolean {
  const c = p.compatibilite;
  if (typeof c === "string") return c === "universel";
  if (c.type === "universel") return true;
  return c.type === "codesMoteurs" && !!c.codes?.includes(codeMoteur);
}

function round5(n: number): number {
  return Math.round(n / 5) * 5;
}

type StagePackDraft = {
  id: string;
  codeMoteur: string;
  stage: number;
  label: string;
  description: string;
  gainChMin: number;
  gainChMax: number;
  gainNmMin: number;
  gainNmMax: number;
  consoDeltaL100: number;
  prixIndicatif: number;
  homologation: "usage_piste";
  includedProductIds: string[];
};

function main() {
  const vehiclesData = loadJson("vehicles.json");
  const productsData = loadJson("products.json");
  const products: ProductEntry[] = productsData.products;

  const engineProducts = products.filter((p) =>
    ["preparation-moteur", "echappement-sport"].includes(p.categoryId)
  );
  const maintenanceProducts = products.filter((p) => p.categoryId === "entretien-moteur");

  function compatibleOf(codeMoteur: string, predicate: (p: ProductEntry) => boolean): ProductEntry[] {
    return engineProducts.filter((p) => isCompatible(p, codeMoteur) && predicate(p));
  }

  const packs: StagePackDraft[] = [];
  let skippedNoData = 0;
  let skippedElectric = 0;

  for (const make of vehiclesData.makes as Array<{ name: string; models: Array<{ name: string; motorisations: Motorisation[] }> }>) {
    for (const model of make.models) {
      for (const m of model.motorisations) {
        if (m.carburant === "electrique" || m.carburant === "hybride") {
          skippedElectric++;
          continue;
        }
        if (!m.puissanceOrigineCh || !m.coupleOrigineNm || !m.carburant) {
          skippedNoData++;
          continue;
        }

        const { codeMoteur, puissanceOrigineCh: ch, coupleOrigineNm: nm } = m;
        const isDiesel = m.carburant === "diesel";
        const maintenancePick = maintenanceProducts.find((p) => /injecteur/i.test(p.name));

        // ── Stage 1 : reprogrammation ECU seule (ou boîtier additionnel), aucune pièce physique ─
        const stage1Ecu =
          compatibleOf(codeMoteur, (p) => /stage\s*1/i.test(p.name)) ??
          compatibleOf(codeMoteur, (p) => /boîtier additionnel/i.test(p.name));
        const stage1Products = [
          stage1Ecu.length ? stage1Ecu[0] : compatibleOf(codeMoteur, (p) => /boîtier additionnel/i.test(p.name))[0],
          maintenancePick,
        ].filter((p): p is ProductEntry => !!p);

        if (stage1Products.length > 0) {
          const gainChMin = Math.max(10, round5(ch * (isDiesel ? 0.15 : 0.12)));
          const gainChMax = Math.max(gainChMin + 10, round5(ch * (isDiesel ? 0.25 : 0.2)));
          const gainNmMin = Math.max(15, round5(nm * (isDiesel ? 0.18 : 0.13)));
          const gainNmMax = Math.max(gainNmMin + 15, round5(nm * (isDiesel ? 0.3 : 0.22)));
          packs.push({
            id: `${codeMoteur}-stage1`,
            codeMoteur,
            stage: 1,
            label: "Stage 1 — Reprogrammation moteur",
            description:
              `Reprogrammation moteur seule (OBDII, sans pièce physique) pour ${make.name} ${model.name} ${m.label}. ` +
              `Gains estimés à titre indicatif — dépendent de l'état moteur et doivent être confirmés sur banc lors de l'installation. ` +
              (isDiesel
                ? "Sur diesel, ce type de reprogrammation vise surtout le couple et peut légèrement réduire la consommation en conduite souple."
                : "Sur essence turbo, attendre une légère hausse de consommation en conduite dynamique."),
            gainChMin, gainChMax, gainNmMin, gainNmMax,
            consoDeltaL100: isDiesel ? -0.1 : 0.4,
            prixIndicatif: stage1Ecu.length ? 320 : 590,
            homologation: "usage_piste",
            includedProductIds: stage1Products.map((p) => p.id),
          });
        }

        // ── Stage 2 : reprog + admission + échappement catalysé (réservé aux moteurs déjà musclés) ─
        if (ch >= (isDiesel ? 150 : 180)) {
          const stage2Ecu = compatibleOf(codeMoteur, (p) => /stage\s*2/i.test(p.name));
          const admission = compatibleOf(codeMoteur, (p) => /admission|filtre à air sport/i.test(p.name));
          const echapp = compatibleOf(
            codeMoteur,
            (p) => /downpipe.*catalys|ligne cat-back|cat-back/i.test(p.name) && !/catless/i.test(p.name)
          );
          const stage2Products = [stage2Ecu[0] ?? stage1Ecu[0], admission[0], echapp[0]].filter(
            (p): p is ProductEntry => !!p
          );
          if (stage2Products.length >= 2) {
            const gainChMin = Math.max(gainOf(stage1(packs, codeMoteur)?.gainChMax, ch, 0.2), round5(ch * 0.2));
            const gainChMax = Math.max(gainChMin + 15, round5(ch * 0.32));
            const gainNmMin = Math.max(15, round5(nm * 0.24));
            const gainNmMax = Math.max(gainNmMin + 20, round5(nm * 0.38));
            packs.push({
              id: `${codeMoteur}-stage2`,
              codeMoteur,
              stage: 2,
              label: "Stage 2 — Reprogrammation + admission + échappement",
              description:
                `Reprogrammation approfondie associée à un kit admission et une ligne d'échappement catalysée pour ${make.name} ${model.name} ${m.label}. ` +
                `Catalyseur conservé (ligne catalysée, pas de suppression FAP/catalyseur — non proposé à la vente). ` +
                `Gains indicatifs, à confirmer sur banc ; hausse de consommation sensible en conduite dynamique.`,
              gainChMin, gainChMax, gainNmMin, gainNmMax,
              consoDeltaL100: isDiesel ? 0.3 : 0.8,
              prixIndicatif: 1450,
              homologation: "usage_piste",
              includedProductIds: stage2Products.map((p) => p.id),
            });
          }
        }

        // ── Stage 3 : hardware majeur (turbo/injecteurs/intercooler) — essence performance uniquement ─
        if (!isDiesel && ch >= 250) {
          const turbo = compatibleOf(codeMoteur, (p) => /turbine turbo|turbo compétition/i.test(p.name));
          const inter = compatibleOf(codeMoteur, (p) => /intercooler/i.test(p.name));
          const injecteurs = compatibleOf(codeMoteur, (p) => /injecteurs gros débit/i.test(p.name));
          const echappHiFlow = compatibleOf(
            codeMoteur,
            (p) => /downpipe.*hi-flow|downpipe.*catalys/i.test(p.name) && !/catless/i.test(p.name)
          );
          const stage3Products = [turbo[0], inter[0], injecteurs[0], echappHiFlow[0]].filter(
            (p): p is ProductEntry => !!p
          );
          if (stage3Products.length >= 2) {
            const gainChMin = Math.max(30, round5(ch * 0.32));
            const gainChMax = Math.max(gainChMin + 20, round5(ch * 0.5));
            const gainNmMin = Math.max(30, round5(nm * 0.35));
            const gainNmMax = Math.max(gainNmMin + 30, round5(nm * 0.55));
            packs.push({
              id: `${codeMoteur}-stage3`,
              codeMoteur,
              stage: 3,
              label: "Stage 3 — Préparation hardware complète",
              description:
                `Préparation lourde (turbo/injecteurs/refroidissement upgradés + reprogrammation dédiée) pour ${make.name} ${model.name} ${m.label}. ` +
                `Catalyseur conservé. Usage circuit recommandé, hausse de consommation et d'usure mécanique significative — ` +
                `installation et réglage par un préparateur qualifié indispensables, gains à valider sur banc.`,
              gainChMin, gainChMax, gainNmMin, gainNmMax,
              consoDeltaL100: 1.4,
              prixIndicatif: 4200,
              homologation: "usage_piste",
              includedProductIds: stage3Products.map((p) => p.id),
            });
          }
        }
      }
    }
  }

  writeFileSync(join(ROOT, "stage-packs.json"), JSON.stringify({ packs }, null, 2) + "\n", "utf8");
  console.log(`Stage packs générés : ${packs.length}`);
  console.log(`  dont stage1: ${packs.filter((p) => p.stage === 1).length}, stage2: ${packs.filter((p) => p.stage === 2).length}, stage3: ${packs.filter((p) => p.stage === 3).length}`);
  console.log(`  motorisations ignorées (électrique/hybride): ${skippedElectric}, (specs manquantes): ${skippedNoData}`);
}

function stage1(packs: StagePackDraft[], codeMoteur: string) {
  return packs.find((p) => p.codeMoteur === codeMoteur && p.stage === 1);
}
function gainOf(prevMax: number | undefined, ch: number, ratio: number): number {
  return prevMax ?? round5(ch * ratio);
}

main();
