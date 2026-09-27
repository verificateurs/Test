// Génération procédurale déterministe de produits pour enrichir data/products.json.
//
// Exécution ponctuelle à la demande (PAS au build) :
//   cd detailix-next && ./node_modules/.bin/tsx ../data/generate-products.ts
//
// Le script CONSERVE les 153 produits d'origine (mêmes id/nom/prix/etc., seul
// le champ optionnel "reviews" leur est (re)calculé à chaque exécution) et
// leur ajoute des variantes générées à partir des templates
// data/templates/<categoryId>.ts, pour chacune des 60 marques de
// data/brands.json. Un PRNG seedé (mulberry32) rend le résultat intégralement
// reproductible d'une exécution à l'autre — et donc idempotent tant que les
// templates (baseNames/formats/finishes/variantsPerBrandTarget) ne changent
// pas entre deux exécutions : la position de chaque tirage dans le flux rng
// dépend de l'ordre et du volume choisi pour CHAQUE marque précédente, donc
// modifier une cible change aussi les combos tirés pour les marques
// suivantes. Après un changement de template, repartir d'un data/products.json
// propre (ex. `git checkout -- data/products.json`) avant de relancer, sous
// peine d'accumuler d'anciennes variantes générées comme "produits existants"
// non nettoyés (voir le filtre par id dans legacyProducts ci-dessous, qui ne
// retire que les id STRICTEMENT identiques à ceux regénérés par CETTE
// exécution). Les avis produits, eux, sont dérivés d'un hash de l'id (voir
// reviewsFor()) : ils restent stables indépendamment de ce flux et du choix
// des cibles.

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

import type { CategoryTemplate, BaseNameEntry, FormatVariant, FinishVariant } from "./templates/types";
import { template as cosmetiqueTpl } from "./templates/cosmetique-carrosserie";
import { template as polishTpl } from "./templates/polish-protection-ceramique";
import { template as jantesTpl } from "./templates/jantes-pneus";
import { template as kitsTpl } from "./templates/kits-carrosserie";
import { template as eclairageTpl } from "./templates/eclairage";
import { template as echappementTpl } from "./templates/echappement-sport";
import { template as coveringTpl } from "./templates/covering-vitres-teintees";
import { template as prepMoteurTpl } from "./templates/preparation-moteur";
import { template as outilsTpl } from "./templates/outils-detailing";
import { template as entretienMoteurTpl } from "./templates/entretien-moteur";

const DATA_DIR = __dirname;
const SEED = 20260910; // fixe en dur : deux exécutions produisent le même résultat.

const TEMPLATES: Record<string, CategoryTemplate> = {
  "cosmetique-carrosserie": cosmetiqueTpl,
  "polish-protection-ceramique": polishTpl,
  "jantes-pneus": jantesTpl,
  "kits-carrosserie": kitsTpl,
  "eclairage": eclairageTpl,
  "echappement-sport": echappementTpl,
  "covering-vitres-teintees": coveringTpl,
  "preparation-moteur": prepMoteurTpl,
  "outils-detailing": outilsTpl,
  "entretien-moteur": entretienMoteurTpl,
};

// ─── PRNG déterministe (mulberry32) ───────────────────────────────────────

function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Classification des motorisations (data/vehicles.json) ───────────────
// Construite manuellement à partir des labels réels du fichier (ex: "TDI",
// "BlueHDi" => diesel ; "TSI/TFSI/EcoBoost/THP/Turbo/Biturbo" => essence
// turbo ; "NA" et V8/V6 atmosphériques identifiés explicitement => atmo).
// Un code absent de cette table fait échouer le script (voir validation
// plus bas) plutôt que de tomber silencieusement dans "any-performance".
type MotorClass = "diesel" | "turbo-petrol" | "atmo" | "electric";

const MOTOR_PROFILE: Record<string, MotorClass> = {
  DFHA: "diesel", CHHB: "turbo-petrol", CJXB: "turbo-petrol", DTSA: "diesel", DGDA: "diesel",
  DPCA: "turbo-petrol", DLAA: "turbo-petrol", DNFA: "turbo-petrol", DKZB: "turbo-petrol",
  CCZB: "turbo-petrol",
  DNUE: "turbo-petrol", DNUA: "turbo-petrol", TFSA: "turbo-petrol", DECA: "turbo-petrol",
  DNCB: "turbo-petrol",
  B47D20B: "diesel", B48B20B: "turbo-petrol", B58B30M0: "turbo-petrol", B47D15A: "diesel",
  B48B20O1: "turbo-petrol", S58B30B: "turbo-petrol", S58B30A: "turbo-petrol",
  M139: "turbo-petrol", M260: "turbo-petrol", M139L: "turbo-petrol",
  M5MT: "turbo-petrol", "M5MT-300": "turbo-petrol", F4RT: "turbo-petrol", H5Ht: "turbo-petrol",
  "H5Ht-GT": "turbo-petrol",
  M2GA: "turbo-petrol", M2DA: "turbo-petrol", SFJA: "turbo-petrol", GENF: "atmo",
  K20C1: "turbo-petrol", "K20C1-FL5": "turbo-petrol", K20A: "atmo",
  "G16E-GTS": "turbo-petrol", FA24: "atmo",
  EJ257: "turbo-petrol", EJ205: "turbo-petrol",
  HNZ: "turbo-petrol", YHZ: "diesel", EP6CDTX: "turbo-petrol", "5FX": "turbo-petrol",
  CJXC: "turbo-petrol",
  "4B11": "turbo-petrol", "4G63T": "turbo-petrol",
  "9A2.2": "atmo", "9A2-S": "turbo-petrol", "9A2-GT3": "atmo",
  VR38DETT: "turbo-petrol", VQ37VHR: "atmo",
  Z16LER: "turbo-petrol", Z20LEH: "turbo-petrol", A28NET: "turbo-petrol",
  PEVPS: "atmo", L3VDT: "turbo-petrol",
  K14C: "turbo-petrol",
  "2URGSE": "atmo",
  EP6DTS: "turbo-petrol", NFU: "atmo",

  // Codes ajoutés lors de l'extension du catalogue vehicles.json (191 codes
  // manquants au moment de la génération, classés par mots-clés du label
  // — TDI/dCi/BlueHDi/CRDi/D-4D => diesel, TSI/TFSI/Turbo/EcoBoost/TCe/T-GDi
  // /THP/Compresseur => turbo-petrol, VTEC/16V/NA/SkyActiv-G => atmo — puis
  // manuellement pour les codes sans mot-clé explicite dans le label, ex.
  // familles moteur BMW N5x/S5x/S6x turbo, M3 E46/E90 atmo, AMG M13x/M17x
  // turbo. "Compresseur" (suralimentation mécanique) classé turbo-petrol.
  // XU9JA/XU5JA/TU5J2 (Peugeot GTI 8v des années 80-90) classés atmo malgré
  // le mot "GTI" dans le label, qui ne désigne pas un moteur suralimenté
  // sur ces blocs. "electric" ajouté à MotorClass pour EASB (moteur 100%
  // électrique, exclu des pools turbo/atmo par construction).
  "DDAA": "diesel", "CUSA": "diesel", "CBDC": "diesel", "DFGA": "diesel",
  "DFHB": "diesel", "CFGB": "diesel", "DTSC": "diesel", "DFGB": "diesel",
  "DETA": "diesel", "CAGB": "diesel", "CFFB": "diesel", "CAHA": "diesel",
  "CAHA-Q5": "diesel", "N47D20A": "diesel", "B47D20C": "diesel", "T7BA": "diesel",
  "1GD-FTV": "diesel", "1AD-FTV": "diesel", "YHZ-508": "diesel", "4N13": "diesel",
  "SH-VPTS": "diesel", "BH01": "diesel", "DFGC": "diesel", "DTVA": "diesel",
  "DFHC": "diesel", "D4FN": "diesel", "204DTD": "diesel", "K9K-LOG": "diesel",
  "CZDA": "turbo-petrol", "CHHC": "turbo-petrol", "DKRF": "turbo-petrol", "DKRA": "turbo-petrol",
  "CJZC": "turbo-petrol", "CCZA": "turbo-petrol", "CCZD": "turbo-petrol", "CCZB-R": "turbo-petrol",
  "AXX": "turbo-petrol", "DNFB": "turbo-petrol", "CULC": "turbo-petrol", "DNFC": "turbo-petrol",
  "DPCB": "turbo-petrol", "DKLC": "turbo-petrol", "CCZE": "turbo-petrol", "DNFD": "turbo-petrol",
  "DPCC": "turbo-petrol", "DKRG": "turbo-petrol", "CJSA": "turbo-petrol", "CJXG": "turbo-petrol",
  "DAZA": "turbo-petrol", "CDLA": "turbo-petrol", "CAKA": "turbo-petrol", "DKZA": "turbo-petrol",
  "CDHB": "turbo-petrol", "CEUC": "turbo-petrol", "CEPB": "turbo-petrol", "CAVE": "turbo-petrol",
  "CDLC": "turbo-petrol", "CAKA-S5": "turbo-petrol", "F4RT-RS": "turbo-petrol", "F4RT-275": "turbo-petrol",
  "H4D-C5": "turbo-petrol", "H5H-C5": "turbo-petrol", "H5Ht-S": "turbo-petrol", "H5H-CAP": "turbo-petrol",
  "F4RT-SCE": "turbo-petrol", "H4Bt400-GT": "turbo-petrol", "M1GA": "turbo-petrol", "G5G": "turbo-petrol",
  "JQMA": "turbo-petrol", "SFJB": "turbo-petrol", "M2GB": "turbo-petrol", "YB": "turbo-petrol",
  "CVH-RS": "turbo-petrol", "G16E-GTS-COR": "turbo-petrol", "B58B30M1": "turbo-petrol", "B48B20M1": "turbo-petrol",
  "3S-GTE": "turbo-petrol", "EJ20-SF": "turbo-petrol", "FA20DIT": "turbo-petrol", "EJ255": "turbo-petrol",
  "5FW": "turbo-petrol",
  "CJXD": "turbo-petrol", "DPCD": "turbo-petrol", "CAVD": "turbo-petrol", "DNFC-VZ": "turbo-petrol",
  "DNUB": "turbo-petrol", "4G63T-VI": "turbo-petrol", "4G63T-ECL": "turbo-petrol", "M97.75": "turbo-petrol",
  "9AA": "turbo-petrol", "M48.50": "turbo-petrol", "RB26DETT": "turbo-petrol", "SR20DET": "turbo-petrol",
  "MR16DDT": "turbo-petrol", "B14XFT": "turbo-petrol", "Z20LEH-H": "turbo-petrol", "B14NET": "turbo-petrol",
  "K14C-VIT": "turbo-petrol", "CHHC-OCT": "turbo-petrol", "DLAB": "turbo-petrol", "CAVF": "turbo-petrol",
  "690T": "turbo-petrol", "940A2000": "turbo-petrol", "940A2000-4C": "turbo-petrol", "690T-STE": "turbo-petrol",
  "940A2000-VEL": "turbo-petrol", "312A3000-595": "turbo-petrol", "312A3000-695": "turbo-petrol", "198A4000": "turbo-petrol",
  "G4FJ": "turbo-petrol", "G4KH": "turbo-petrol", "G4KH-P": "turbo-petrol", "G4KH-KONA": "turbo-petrol",
  "G4KH-VEL": "turbo-petrol", "G6DH": "turbo-petrol", "G4FJ-CEED": "turbo-petrol", "G4FJ-PRO": "turbo-petrol",
  "G3LC": "turbo-petrol", "B4204T39": "turbo-petrol", "B4204T39-S": "turbo-petrol", "B4204T31": "turbo-petrol",
  "B21FT": "turbo-petrol", "B48A20A": "turbo-petrol", "B48A20O1": "turbo-petrol", "N14B16A": "turbo-petrol",
  "W11B16A": "turbo-petrol", "B48A20O2": "turbo-petrol", "AJ133": "turbo-petrol", "AJ133-P8": "turbo-petrol",
  "AJ133-XKR": "turbo-petrol", "AJ133-SVR": "turbo-petrol", "H4D-SAN": "turbo-petrol", "H5H-DUS": "turbo-petrol",
  "AJ300P": "turbo-petrol", "N54B30A": "turbo-petrol", "B48B20O2": "turbo-petrol", "S55B30A0": "turbo-petrol",
  "S58B30O0": "turbo-petrol", "S58B30M0": "turbo-petrol", "S58B30O2": "turbo-petrol", "B48B20B4": "turbo-petrol",
  "S63B44T4": "turbo-petrol", "S58B30M1": "turbo-petrol", "S63B44T3": "turbo-petrol", "B58B30M2": "turbo-petrol",
  "M133": "turbo-petrol", "M139-CLA": "turbo-petrol", "M177": "turbo-petrol", "M139-C43": "turbo-petrol",
  "M139-GLA": "turbo-petrol", "M177-E63": "turbo-petrol", "M177-G63": "turbo-petrol", "M178-GT": "turbo-petrol",
  "HN05": "turbo-petrol",
  "F4R-172": "atmo", "K4M-RS": "atmo", "K20Z4": "atmo", "K20A-FD2": "atmo",
  "K20A2": "atmo", "B18C": "atmo", "F20C": "atmo", "C30A": "atmo",
  "H22A7": "atmo", "FA20": "atmo", "2ZZ-GE": "atmo", "FA20-BRZ": "atmo",
  "XU10J4": "atmo", "MA1.75": "atmo", "M97.21": "atmo", "P5VPS": "atmo",
  "XU9JA": "atmo", "XU5JA": "atmo", "TU5J2": "atmo",
  "LF-VE": "atmo", "TU5J4": "atmo", "XU10J4-XSA": "atmo", "350A1000": "atmo",
  "BUB": "atmo", "S54B32": "atmo", "S65B40": "atmo", "N52B30": "atmo",
  "M15A-FXE": "atmo", "20NE": "atmo", "B6-NB": "atmo", "M16A": "atmo",
  "M16A-31S": "atmo", "2UR-GSE": "atmo", "2URGSE-GS": "atmo", "TU3": "atmo",
  "AR32304": "atmo",
  "EASB": "electric",
};

// ─── Barème de gamme (data/brands.json) ───────────────────────────────────
// Les 10 valeurs distinctes réellement présentes dans brands.json (le champ
// n'est PAS limité aux 4 valeurs "Entrée/Milieu/Haut/Premium" imaginées au
// départ). Toute valeur non répertoriée fait échouer le script.
const GAMME_TIER: Record<string, number> = {
  "Entrée-milieu de gamme": 0.7,
  "Milieu de gamme": 0.85,
  "Pro": 1.0,
  "Milieu-haut de gamme": 1.15,
  "Haut de gamme": 1.4,
  "Haut de gamme / Compétition": 1.65,
  "Compétition": 1.8,
  "Très haut de gamme": 1.95,
  "Compétition / Show": 2.05,
  "Très haut de gamme / Compétition": 2.2,
};
const TIER_MIN = 0.7;
const TIER_MAX = 2.2;

function tierFor(gamme: string): number {
  const t = GAMME_TIER[gamme];
  if (t === undefined) {
    throw new Error(`Valeur de gamme inconnue: "${gamme}" — ajoutez-la à GAMME_TIER dans generate-products.ts.`);
  }
  return t;
}

function roundPrice(v: number): number {
  if (v < 20) return Math.round(v * 2) / 2;
  if (v < 100) return Math.round(v / 5) * 5;
  if (v < 1000) return Math.round(v / 10) * 10;
  return Math.round(v / 50) * 50;
}

// ─── Chargement des données sources ───────────────────────────────────────

function loadJson(name: string) {
  return JSON.parse(readFileSync(join(DATA_DIR, name), "utf8"));
}

interface BrandJson {
  id: string;
  name: string;
  gamme: string;
}
interface CategoryJson {
  id: string;
  brands: BrandJson[];
}
interface BrandsFile {
  categories: CategoryJson[];
}

interface MotorisationJson {
  id: string;
  label: string;
  codeMoteur: string;
}
interface ModelJson {
  id: string;
  name: string;
  motorisations: MotorisationJson[];
}
interface MakeJson {
  id: string;
  name: string;
  models: ModelJson[];
}
interface VehiclesFile {
  makes: MakeJson[];
}

interface ReviewJson {
  author: string;
  rating: number;
  date: string;
  comment: string;
}
interface ProductJson {
  id: string;
  brandId: string;
  categoryId: string;
  name: string;
  format: string;
  description: string;
  prixAchat: number;
  stock: boolean;
  compatibilite: string | { type: "universel" } | { type: "codesMoteurs"; codes: string[] };
  homologation?: string;
  reviews?: ReviewJson[];
}
interface ProductsFile {
  _note: string;
  products: ProductJson[];
}

const brandsData = loadJson("brands.json") as BrandsFile;
const vehiclesData = loadJson("vehicles.json") as VehiclesFile;
const productsData = loadJson("products.json") as ProductsFile;

// ─── Pools de codeMoteur déduplités par profil ────────────────────────────

const allCodes = new Set<string>();
for (const make of vehiclesData.makes) {
  for (const model of make.models) {
    for (const m of model.motorisations) allCodes.add(m.codeMoteur);
  }
}
for (const code of allCodes) {
  if (!(code in MOTOR_PROFILE)) {
    throw new Error(
      `codeMoteur "${code}" présent dans vehicles.json mais absent de MOTOR_PROFILE — classez-le avant de générer.`
    );
  }
}
const turboPool = [...allCodes].filter((c) => MOTOR_PROFILE[c] === "turbo-petrol").sort();
const atmoPool = [...allCodes].filter((c) => MOTOR_PROFILE[c] === "atmo").sort();
const anyPerfPool = [...turboPool, ...atmoPool].sort();

function motorPool(profile: "turbo-petrol" | "atmo" | "any-performance" | undefined): string[] {
  if (profile === "turbo-petrol") return turboPool;
  if (profile === "atmo") return atmoPool;
  return anyPerfPool;
}

type Compat = { type: "universel" } | { type: "codesMoteurs"; codes: string[] };

function pickCodesMoteurs(profile: "turbo-petrol" | "atmo" | "any-performance" | undefined, rng: () => number): Compat {
  const pool = motorPool(profile);
  const n = Math.min(pool.length, 1 + Math.floor(rng() * 5));
  const codes = shuffle([...pool], rng).slice(0, n).sort();
  return { type: "codesMoteurs", codes };
}

function resolveCompat(
  tpl: CategoryTemplate,
  baseName: BaseNameEntry,
  format: FormatVariant,
  rng: () => number
): Compat {
  if (baseName.forceUniversel) return { type: "universel" };
  if (format.compat === "universel") return { type: "universel" };
  if (format.compat === "codesMoteurs") return pickCodesMoteurs(baseName.motorProfile, rng);
  if (tpl.compatStrategy === "universel") return { type: "universel" };
  return pickCodesMoteurs(baseName.motorProfile, rng);
}

// ─── Construction des combinaisons baseName × format × finition ──────────

interface Combo {
  baseName: BaseNameEntry;
  format: FormatVariant;
  finish?: FinishVariant;
}

function buildCombos(tpl: CategoryTemplate): Combo[] {
  const combos: Combo[] = [];
  for (const bn of tpl.baseNames) {
    const formats = tpl.formatVariants.filter((f) => !f.group || !bn.group || f.group === bn.group);
    const finishes: (FinishVariant | undefined)[] =
      !bn.noFinish && tpl.finishVariants && tpl.finishVariants.length > 0 ? tpl.finishVariants : [undefined];
    for (const format of formats) {
      for (const finish of finishes) {
        combos.push({ baseName: bn, format, finish });
      }
    }
  }
  return combos;
}

// Produit cartésien opener × benefit × closer d'un template. Comme pour
// buildCombos ci-dessus, ce pool est mélangé UNE FOIS par catégorie puis
// consommé séquentiellement (voir descCombos plus bas) pour garantir
// qu'aucune combinaison n'est tirée deux fois tant que le pool n'est pas
// épuisé, au lieu de trois pick() indépendants qui se répètent par collision
// (paradoxe des anniversaires) dès que le nombre de produits grandit.
function buildDescriptionCombos(tpl: CategoryTemplate): [string, string, string][] {
  const combos: [string, string, string][] = [];
  for (const opener of tpl.descriptionOpeners) {
    for (const benefit of tpl.descriptionBenefits) {
      for (const closer of tpl.descriptionClosers) {
        combos.push([opener, benefit, closer]);
      }
    }
  }
  return combos;
}

// ─── Génération ────────────────────────────────────────────────────────────

const rng = mulberry32(SEED);
const generated: ProductJson[] = [];
const generatedIds = new Set<string>();

interface CategoryStat {
  categoryId: string;
  brands: number;
  generated: number;
}
const categoryStats: CategoryStat[] = [];

for (const cat of brandsData.categories) {
  const tpl = TEMPLATES[cat.id];
  if (!tpl) throw new Error(`Aucun template data/templates/${cat.id}.ts pour la catégorie "${cat.id}".`);

  const combos = buildCombos(tpl);
  let catGenerated = 0;

  // RNG dédié à la catégorie (dérivé de SEED + hash de son id), distinct du
  // rng partagé : le mélange des combinaisons de description ne consomme
  // ainsi aucun tirage du flux principal et ne décale ni les id, ni les prix,
  // ni le stock, ni la compatibilité des produits générés plus loin.
  const descCombos = shuffle(buildDescriptionCombos(tpl), mulberry32((SEED ^ hashId(cat.id)) >>> 0));
  let descIndex = 0;

  for (const brand of cat.brands) {
    const tier = tierFor(brand.gamme);
    const available = combos.length;
    const upperBound = Math.min(30, Math.floor(available / 3));
    const lowerBound = Math.min(15, upperBound);
    const jitter = Math.floor(rng() * 5) - 2; // -2..+2
    const desired = tpl.variantsPerBrandTarget + jitter;
    const count = Math.max(lowerBound, Math.min(upperBound, desired));

    const chosen = shuffle(combos.slice(), rng).slice(0, count);

    for (const combo of chosen) {
      const { baseName, format, finish } = combo;

      const norm = (tier - TIER_MIN) / (TIER_MAX - TIER_MIN);
      const [minP, maxP] = tpl.priceRangeHT;
      const base = minP + norm * (maxP - minP);
      const noise = 1 + (rng() * 2 - 1) * 0.06;
      const finishMult = finish?.multiplier ?? 1;
      const prixAchat = roundPrice(base * format.sizeMultiplier * finishMult * noise);

      const stock = prixAchat > 900 ? rng() > 0.12 : rng() > 0.03;

      const compatibilite = resolveCompat(tpl, baseName, format, rng);

      // 3 tirages rng() conservés (ignorés) pour ne pas décaler le flux
      // partagé : pick() consomme toujours exactement 1 rng() par appel quel
      // que soit la taille du pool, donc l'agrandissement des templates ne
      // déplace rien ici. La description vient désormais de descCombos.
      pick(tpl.descriptionOpeners, rng);
      pick(tpl.descriptionBenefits, rng);
      pick(tpl.descriptionClosers, rng);
      const [opener, benefit, closer] = descCombos[descIndex % descCombos.length];
      descIndex++;
      const description = `${opener} ${benefit} ${closer}`;

      const idParts = [brand.id, slugify(baseName.name), slugify(format.label)];
      if (finish) idParts.push(slugify(finish.label));
      const id = idParts.filter(Boolean).join("-");

      generated.push({
        id,
        brandId: brand.id,
        categoryId: cat.id,
        name: baseName.name,
        format: format.label,
        description,
        prixAchat,
        stock,
        compatibilite,
      });
      generatedIds.add(id);
      catGenerated++;
    }
  }

  if (catGenerated > descCombos.length) {
    console.warn(
      `Catégorie "${cat.id}": ${catGenerated} produits générés pour ${descCombos.length} combinaisons de ` +
        `description disponibles — le cycle réutilise des combinaisons déjà vues, des doublons sont possibles ` +
        `dans cette catégorie. Enrichissez descriptionOpeners/Benefits/Closers dans data/templates/${cat.id}.ts.`
    );
  }

  categoryStats.push({ categoryId: cat.id, brands: cat.brands.length, generated: catGenerated });
}

// Sécurité : aucune collision d'id générée (ni entre nouvelles entrées, ni
// avec un id existant qui ne serait pas déjà régénéré à l'identique).
if (generatedIds.size !== generated.length) {
  throw new Error("Collision d'id détectée au sein des produits générés.");
}

// ─── Écriture — idempotente ────────────────────────────────────────────────
// legacyProducts retire du fichier existant tout produit dont l'id est aussi
// produit par CETTE exécution (donc, sur une relance, les entrées générées
// au tour précédent — mêmes ids car déterministe — sont retirées puis
// régénérées à l'identique : pas de duplication).
const legacyProducts = productsData.products.filter((p) => !generatedIds.has(p.id));
const finalProducts = [...legacyProducts, ...generated];

const finalIdSet = new Set(finalProducts.map((p) => p.id));
if (finalIdSet.size !== finalProducts.length) {
  throw new Error("Collision d'id détectée entre produits existants et produits générés.");
}

// ─── Avis produits ──────────────────────────────────────────────────────────
// Générés pour une partie des produits (existants et générés), avec un PRNG
// dérivé de l'id du produit (hash FNV-1a) plutôt que de la position dans le
// flux global : le résultat par produit reste stable même si une future
// relance change les cibles de génération (donc la liste/l'ordre des autres
// produits), ce qui n'est pas garanti par le rng partagé ci-dessus.

function hashId(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const REVIEW_SEED_SALT = 0x9e3779b1;
const REVIEW_INCLUSION_RATE = 0.4; // ~30-50% des produits reçoivent des avis.
const REVIEW_DATE_START = Date.UTC(2025, 5, 1); // 2025-06-01
const REVIEW_DATE_END = Date.UTC(2026, 7, 31); // 2026-08-31

const REVIEW_AUTHORS = [
  "Julien R.", "Sophie M.", "Thomas B.", "Camille D.", "Nicolas P.", "Émilie L.",
  "Alexandre G.", "Laura F.", "Mathieu V.", "Marion C.", "Kevin T.", "Julie N.",
  "David S.", "Chloé A.", "Romain H.", "Sarah K.", "Antoine J.", "Manon E.",
  "Florian W.", "Léa Q.", "Guillaume Y.", "Pauline Z.", "Maxime O.", "Aurélie X.",
  "Benjamin I.", "Elodie U.", "Vincent C.", "Céline B.", "Damien R.", "Nathalie M.",
  "Fabien D.", "Stéphanie P.", "Olivier L.", "Karine G.", "Sébastien F.", "Isabelle V.",
  "Cédric N.", "Delphine T.", "Bruno S.", "Virginie A.", "Laurent H.", "Charlotte K.",
  "Patrick J.", "Anaïs E.", "Michael W.", "Sandrine Q.", "Yann Y.", "Adeline Z.",
];

const CATEGORY_REVIEW_COMMENTS: Record<string, { positive: string[]; mixed: string[] }> = {
  "cosmetique-carrosserie": {
    positive: [
      "Résultat au top, la carrosserie retrouve tout son éclat dès la première utilisation.",
      "Très satisfait, ce produit sent bon et ne laisse aucune trace après séchage.",
      "Facile à utiliser et économique à l'usage, parfait pour un entretien régulier.",
      "Mousse bien et rince facilement, je recommande sans hésiter.",
      "Efficace sur les résidus tenaces sans agresser la peinture, exactement ce qu'il me fallait.",
      "Bon rapport qualité/prix, je rachète régulièrement.",
      "Utilisation simple, odeur agréable et résultat au rendez-vous à chaque lavage.",
      "Devenu un indispensable de ma routine du week-end.",
    ],
    mixed: [
      "Correct sans plus, il faut plusieurs passages pour un résultat vraiment net.",
      "Le flacon se vide vite, le format ne dure pas très longtemps chez moi.",
      "Bon produit mais le parfum est un peu trop présent à mon goût.",
      "Fait le travail mais rien d'exceptionnel comparé à d'autres marques testées.",
      "Efficace sur salissures légères, moins convaincant sur les taches anciennes.",
    ],
  },
  "polish-protection-ceramique": {
    positive: [
      "Effet hydrophobe bluffant, l'eau perle vraiment plusieurs semaines après l'application.",
      "Facile à appliquer même pour un débutant, le rendu est brillant et homogène.",
      "Correction efficace sur les hologrammes, la peinture a retrouvé de la profondeur.",
      "Tenue dans le temps très convaincante, le lavage suivant glisse tout seul.",
      "Un vrai plus après le polish, la brillance est nettement supérieure à avant.",
      "Application propre sans marquage, résultat digne d'un préparateur pro.",
      "La protection tient bon même après plusieurs lavages haute pression.",
      "Rapport durée/prix excellent pour une protection céramique de ce niveau.",
    ],
    mixed: [
      "Bon produit mais le temps de durcissement est plus long qu'annoncé.",
      "Résultat correct, il faut vraiment bien dégraisser avant pour un effet optimal.",
      "Efficace au début, l'effet hydrophobe s'estompe un peu plus vite que prévu.",
      "Application technique, pas évidente sans un peu d'expérience en detailing.",
      "Bon produit dans l'ensemble, juste dommage que le flacon soit petit pour le prix.",
    ],
  },
  "jantes-pneus": {
    positive: [
      "Montage rapide, le rendu final est propre et proche de l'origine constructeur.",
      "Finition soignée, l'accessoire complète parfaitement la monte de jantes.",
      "Décrasse efficacement les résidus de freinage sans attaquer le vernis des jantes.",
      "Fixation solide, aucun souci même après plusieurs milliers de kilomètres.",
      "Exactement ce qu'il fallait pour sécuriser et personnaliser mes jantes aftermarket.",
      "Bon accessoire, simple à poser et vraiment efficace au quotidien.",
      "Protège bien les jantes contre la corrosion, même en hiver avec le sel.",
      "Livraison rapide et produit conforme à la description, rien à redire.",
    ],
    mixed: [
      "Correct mais la notice de montage pourrait être plus détaillée.",
      "Bon accessoire, juste un peu cher pour ce que c'est.",
      "Efficace sur l'encrassement léger, moins sur les résidus de freinage incrustés.",
      "Finition satisfaisante mais la teinte diffère légèrement des photos.",
      "Fait le travail mais le montage demande un peu plus de temps que prévu.",
    ],
  },
  "kits-carrosserie": {
    positive: [
      "Ajustement fidèle aux lignes d'origine, le rendu visuel change vraiment le véhicule.",
      "Pièce bien finie, montage assisté par mon carrossier sans difficulté particulière.",
      "Qualité de fabrication sérieuse, rien à voir avec certaines copies bon marché.",
      "Look sportif garanti, les retours sur la route sont unanimes.",
      "Visserie fournie complète, montage conforme aux instructions sans surprise.",
      "Bon compromis entre esthétique et rigidité, je suis très satisfait du résultat.",
      "Une préparation qui change vraiment l'allure du véhicule, très bon achat.",
      "Livré protégé et sans défaut, prêt pour la mise en peinture.",
    ],
    mixed: [
      "Un ajustement fin a été nécessaire chez le carrossier avant fixation définitive.",
      "Bonne pièce mais le délai de livraison était plus long qu'annoncé.",
      "Rendu correct, quelques finitions à reprendre avant peinture.",
      "Qualité satisfaisante pour le prix, sans être du niveau d'une pièce d'origine.",
      "Montage plus technique que prévu, mieux vaut passer par un professionnel.",
    ],
  },
  "eclairage": {
    positive: [
      "Faisceau net et puissant, une nette amélioration par rapport à l'éclairage d'origine.",
      "Installation plug-and-play très simple, aucune modification du câblage nécessaire.",
      "Température de couleur agréable, confort visuel réel en conduite nocturne.",
      "Bonne portée et bonne largeur de faisceau, je me sens plus en sécurité de nuit.",
      "Montage rapide en moins de dix minutes, résultat immédiatement visible.",
      "Boîtier robuste, aucun souci même après plusieurs mois d'utilisation intensive.",
      "Très satisfait de la luminosité, largement supérieure aux ampoules d'origine.",
      "Un bon investissement pour la sécurité, surtout sur route de campagne non éclairée.",
    ],
    mixed: [
      "Bon produit mais un léger scintillement au démarrage à froid.",
      "Faisceau correct, un contrôle technique de conformité reste recommandé.",
      "Installation plus longue que prévu sur mon modèle de véhicule.",
      "Efficace mais l'éblouissement en face peut être un peu marqué de nuit.",
      "Luminosité satisfaisante, sans être aussi spectaculaire que la publicité le laisse penser.",
    ],
  },
  "echappement-sport": {
    positive: [
      "Sonorité affirmée sans devenir fatigante au quotidien, exactement ce que je cherchais.",
      "Montage propre avec les colliers fournis, compatible directement avec la ligne d'origine.",
      "Gain de réactivité vraiment perceptible en accélération, très bon produit.",
      "Fabrication en inox de qualité, finition soignée jusque dans les soudures.",
      "Un passage au banc a confirmé le gain annoncé, très satisfait de l'achat.",
      "Le son est présent sans être agressif, parfait pour un usage route quotidien.",
      "Montage réalisé par mon préparateur, ajustement parfait sans modification.",
      "Rapport gain sonore et fiabilité excellent, je recommande cette pièce.",
    ],
    mixed: [
      "Bon produit mais un peu plus sonore que ce à quoi je m'attendais en usage quotidien.",
      "Montage nécessitant un passage chez un professionnel pour un ajustement parfait.",
      "Qualité de fabrication correcte, sans être exceptionnelle pour le prix.",
      "Gain sonore présent mais le gain en performance reste difficile à percevoir sans banc.",
      "Bonne pièce dans l'ensemble, juste un léger bruit métallique à froid au démarrage.",
    ],
  },
  "covering-vitres-teintees": {
    positive: [
      "Pose sans bulle grâce à la technologie repositionnable, rendu final impeccable.",
      "Film conforme aux photos, la protection contre les gravillons est vraiment efficace.",
      "Installateur certifié, résultat digne d'une finition d'origine, aucun regret.",
      "Tenue dans le temps très convaincante, aucun jaunissement après plusieurs mois.",
      "Bon produit pour préserver la peinture d'origine avant revente du véhicule.",
      "Conformité vérifiée au contrôle technique, aucune remarque de l'agent.",
      "Le rendu esthétique est net, on dirait vraiment une teinte d'origine.",
      "Protection efficace contre les UV et les lavages haute pression répétés.",
    ],
    mixed: [
      "Bon produit mais la pose demande vraiment un installateur expérimenté.",
      "Rendu satisfaisant, quelques micro-bulles résiduelles sur les zones complexes.",
      "Film conforme mais le délai d'installation a été plus long qu'annoncé.",
      "Protection correcte, la teinte parait légèrement plus foncée qu'en photo.",
      "Bon produit dans l'ensemble, coût d'installation à prévoir en plus du film.",
    ],
  },
  "preparation-moteur": {
    positive: [
      "Montage plug-and-play, aucun souci de fiabilité après plusieurs milliers de kilomètres.",
      "Gain confirmé au banc, la pièce tient ses promesses sans compromis sur la fiabilité.",
      "Réponse moteur nettement plus vive à l'accélération, très satisfait de la préparation.",
      "Documentation complète fournie, montage guidé sans difficulté particulière.",
      "Qualité de fabrication sérieuse, adaptée à un usage circuit prolongé.",
      "Complète parfaitement ma préparation Stage 1, aucun regret sur cet achat.",
      "Fiabilité au rendez-vous même en usage intensif sur piste.",
      "Un choix éprouvé, plusieurs préparateurs de ma région recommandent cette pièce.",
    ],
    mixed: [
      "Bon produit mais un passage au banc reste indispensable pour valider le comportement moteur.",
      "Montage plus technique que prévu, mieux vaut passer par un professionnel.",
      "Gain présent mais moins marqué que ce que j'espérais initialement.",
      "Bonne pièce mais le prix reste élevé comparé à d'autres références du marché.",
      "Fiabilité satisfaisante pour l'instant, à confirmer sur le plus long terme.",
    ],
  },
  "outils-detailing": {
    positive: [
      "Ergonomie excellente, aucune fatigue même après une session complète de polish.",
      "Résultat homogène sur les grands panneaux comme sur les zones difficiles d'accès.",
      "Consommable de bonne qualité, ne laisse aucune trace ni résidu après usage.",
      "Prise en main immédiate, parfait même pour un usage occasionnel à la maison.",
      "Résiste bien à un usage répété sans perte de performance dans le temps.",
      "Très bon rapport qualité/prix pour un outil utilisé chaque week-end.",
      "Livré avec tout le nécessaire, aucun accessoire supplémentaire à acheter.",
      "Un indispensable de l'atelier, je ne reviendrais pas en arrière.",
    ],
    mixed: [
      "Bon outil mais un peu bruyant en usage prolongé.",
      "Correct pour un usage occasionnel, moins adapté à un usage professionnel intensif.",
      "Consommable efficace mais qui s'use un peu plus vite qu'annoncé.",
      "Bonne prise en main, juste un peu lourd pour les longues sessions.",
      "Fait le travail sans plus, rien d'exceptionnel comparé à d'autres marques testées.",
    ],
  },
  "entretien-moteur": {
    positive: [
      "Utilisation simple, dosage clair et effet perceptible dès le plein suivant.",
      "Bon produit d'entretien préventif, je l'utilise désormais à chaque vidange.",
      "Flacon bien dosé pour la taille du réservoir, aucune difficulté d'utilisation.",
      "Résultat conforme aux attentes, le moteur tourne plus rond après traitement.",
      "Produit efficace en entretien régulier, je n'ai plus les à-coups que j'avais avant.",
      "Facile à intégrer dans ma routine d'entretien, notice claire et complète.",
      "Bon rapport qualité/prix pour un entretien préventif entre deux révisions.",
      "Produit sérieux, conforme à ce qu'utilise mon garagiste habituel.",
    ],
    mixed: [
      "Correct mais l'effet reste difficile à mesurer sans passage au diagnostic.",
      "Bon produit dans l'ensemble, le dosage demande d'être précis pour un petit réservoir.",
      "Fait le travail mais plusieurs applications semblent nécessaires pour un résultat net.",
      "Efficace sur un encrassement léger, moins convaincant sur un cas plus avancé.",
      "Produit satisfaisant, juste un peu cher pour le format proposé.",
    ],
  },
};

function ratingFor(rng: () => number): number {
  const r = rng();
  if (r < 0.05) return 2;
  if (r < 0.15) return 3;
  if (r < 0.55) return 4;
  return 5;
}

function reviewDate(rng: () => number): string {
  const t = REVIEW_DATE_START + rng() * (REVIEW_DATE_END - REVIEW_DATE_START);
  return new Date(t).toISOString().slice(0, 10);
}

function reviewsFor(p: ProductJson): ReviewJson[] | undefined {
  const rng = mulberry32((hashId(p.id) ^ REVIEW_SEED_SALT) >>> 0);
  if (rng() >= REVIEW_INCLUSION_RATE) return undefined;

  const pools = CATEGORY_REVIEW_COMMENTS[p.categoryId];
  if (!pools) return undefined;

  const count = 2 + Math.floor(rng() * 3); // 2..4
  const authors = shuffle([...REVIEW_AUTHORS], rng).slice(0, count);

  const reviews: ReviewJson[] = [];
  for (let i = 0; i < count; i++) {
    const rating = ratingFor(rng);
    const comment = rating <= 3 ? pick(pools.mixed, rng) : pick(pools.positive, rng);
    reviews.push({ author: authors[i], rating, date: reviewDate(rng), comment });
  }
  return reviews;
}

for (const p of finalProducts) {
  p.reviews = reviewsFor(p);
}

function formatCompat(c: ProductJson["compatibilite"]): string {
  if (typeof c === "string") return JSON.stringify(c);
  if (c.type === "universel") return `{ "type": "universel" }`;
  if (c.type === "codesMoteurs") {
    return `{ "type": "codesMoteurs", "codes": [${c.codes.map((x) => JSON.stringify(x)).join(", ")}] }`;
  }
  throw new Error(`compatibilite invalide: ${JSON.stringify(c)}`);
}

function formatReviews(reviews: ReviewJson[]): string {
  const items = reviews.map(
    (r) =>
      `{ "author": ${JSON.stringify(r.author)}, "rating": ${r.rating}, "date": ${JSON.stringify(
        r.date
      )}, "comment": ${JSON.stringify(r.comment)} }`
  );
  return `[${items.join(", ")}]`;
}

function productLine(p: ProductJson): string {
  const fields = [
    `"id": ${JSON.stringify(p.id)}`,
    `"brandId": ${JSON.stringify(p.brandId)}`,
    `"categoryId": ${JSON.stringify(p.categoryId)}`,
    `"name": ${JSON.stringify(p.name)}`,
    `"format": ${JSON.stringify(p.format)}`,
    `"description": ${JSON.stringify(p.description)}`,
    `"prixAchat": ${p.prixAchat}`,
    `"stock": ${p.stock}`,
    `"compatibilite": ${formatCompat(p.compatibilite)}`,
  ];
  if (p.homologation) fields.push(`"homologation": ${JSON.stringify(p.homologation)}`);
  if (p.reviews && p.reviews.length > 0) fields.push(`"reviews": ${formatReviews(p.reviews)}`);
  return `    { ${fields.join(", ")} }`;
}

const body = finalProducts.map(productLine).join(",\n");
const out = `{\n  "_note": ${JSON.stringify(productsData._note)},\n  "products": [\n${body}\n  ]\n}\n`;

writeFileSync(join(DATA_DIR, "products.json"), out, "utf8");

// ─── Rapport console ───────────────────────────────────────────────────────

console.log("Génération terminée.");
console.log(`  Produits existants conservés : ${legacyProducts.length}`);
console.log(`  Produits générés             : ${generated.length}`);
console.log(`  Total                        : ${finalProducts.length}`);
console.log("");
console.log("Répartition par catégorie (existants -> générés -> total) :");
for (const stat of categoryStats) {
  const existingCount = productsData.products.filter(
    (p) => p.categoryId === stat.categoryId && !generatedIds.has(p.id)
  ).length;
  console.log(
    `  ${stat.categoryId.padEnd(28)} ${stat.brands} marques  ${String(existingCount).padStart(3)} -> +${String(
      stat.generated
    ).padStart(4)} -> ${existingCount + stat.generated}`
  );
}

const productsWithReviews = finalProducts.filter((p) => p.reviews && p.reviews.length > 0);
const totalReviews = productsWithReviews.reduce((n, p) => n + (p.reviews?.length ?? 0), 0);
console.log("");
console.log(
  `Avis produits : ${productsWithReviews.length} produits avec avis (${(
    (productsWithReviews.length / finalProducts.length) *
    100
  ).toFixed(1)}%), ${totalReviews} avis au total.`
);
