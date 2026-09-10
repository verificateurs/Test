#!/usr/bin/env node
/**
 * Vérifie la cohérence référentielle du catalogue :
 * - IDs uniques dans products.json
 * - brandId → id existant dans brands.json
 * - categoryId → id existant dans brands.json (categories)
 * - codes moteur dans compatibilite → codeMoteur existant dans vehicles.json
 */

const fs = require("fs");
const path = require("path");

const DATA = path.join(__dirname, "..", "data");

function load(name) {
  const file = path.join(DATA, name);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`❌  Impossible de lire ${name}: ${e.message}`);
    process.exit(1);
  }
}

const brands   = load("brands.json");
const products = load("products.json");
const vehicles = load("vehicles.json");

let errors = 0;
let warnings = 0;

function err(msg)  { console.error(`  ❌  ${msg}`); errors++; }
function warn(msg) { console.warn (`  ⚠️   ${msg}`); warnings++; }

// --- Collecter les sets de référence ---

// Catégories : brands.json peut stocker les catégories de deux façons.
// On cherche soit un tableau "categories", soit un champ imbriqué dans les marques.
let categoryIds = new Set();
let brandIds    = new Set();

if (Array.isArray(brands.categories)) {
  for (const cat of brands.categories) {
    if (cat.id) categoryIds.add(cat.id);
    if (Array.isArray(cat.brands)) {
      for (const b of cat.brands) {
        if (b.id) brandIds.add(b.id);
      }
    }
  }
} else {
  // Fallback : brands.json est un tableau plat de marques
  const arr = Array.isArray(brands) ? brands : (brands.brands || []);
  for (const b of arr) {
    if (b.id) brandIds.add(b.id);
    if (b.categoryId) categoryIds.add(b.categoryId);
  }
}

// Codes moteur depuis vehicles.json
let motorCodes = new Set();
const makes = Array.isArray(vehicles) ? vehicles : (vehicles.makes || vehicles.marques || []);
for (const make of makes) {
  const models = make.models || make.modeles || [];
  for (const model of models) {
    const motorisations = model.motorisations || [];
    for (const m of motorisations) {
      if (m.codeMoteur) motorCodes.add(m.codeMoteur);
    }
  }
}

console.log(`\n📂  Catalogue Detailix — validation\n`);
console.log(`   Catégories trouvées  : ${categoryIds.size}`);
console.log(`   Marques trouvées     : ${brandIds.size}`);
console.log(`   Codes moteur trouvés : ${motorCodes.size}`);
console.log();

// --- Valider products.json ---

const productList = Array.isArray(products) ? products : (products.products || []);
const seenIds = new Set();

console.log(`🔍  Validation de ${productList.length} produits…`);

for (const p of productList) {
  const ctx = `Produit "${p.id || "(sans id)"}"`;

  // ID présent et unique
  if (!p.id) {
    err(`${ctx} : champ "id" manquant.`);
  } else if (seenIds.has(p.id)) {
    err(`${ctx} : id dupliqué.`);
  } else {
    seenIds.add(p.id);
  }

  // brandId valide
  if (!p.brandId) {
    err(`${ctx} : champ "brandId" manquant.`);
  } else if (!brandIds.has(p.brandId)) {
    err(`${ctx} : brandId "${p.brandId}" introuvable dans brands.json.`);
  }

  // categoryId valide
  if (!p.categoryId) {
    err(`${ctx} : champ "categoryId" manquant.`);
  } else if (!categoryIds.has(p.categoryId)) {
    err(`${ctx} : categoryId "${p.categoryId}" introuvable dans brands.json.`);
  }

  // prixAchat présent et > 0
  if (typeof p.prixAchat !== "number" || p.prixAchat <= 0) {
    err(`${ctx} : "prixAchat" doit être un nombre positif (valeur: ${p.prixAchat}).`);
  }

  // compatibilite
  if (p.compatibilite === undefined) {
    warn(`${ctx} : champ "compatibilite" absent (attendu "universel" ou objet).`);
  } else if (p.compatibilite !== "universel") {
    const c = p.compatibilite;
    if (!c || typeof c !== "object") {
      err(`${ctx} : "compatibilite" invalide (doit être "universel" ou {type, codes}).`);
    } else {
      if (c.type !== "codesMoteurs") {
        err(`${ctx} : compatibilite.type "${c.type}" inconnu (attendu "codesMoteurs").`);
      }
      if (!Array.isArray(c.codes) || c.codes.length === 0) {
        err(`${ctx} : compatibilite.codes doit être un tableau non vide.`);
      } else {
        for (const code of c.codes) {
          if (!motorCodes.has(code)) {
            warn(`${ctx} : code moteur "${code}" absent de vehicles.json.`);
          }
        }
      }
    }
  }
}

// --- Résultat ---
console.log();
if (errors === 0 && warnings === 0) {
  console.log(`✅  Catalogue valide — ${productList.length} produits, aucune erreur.\n`);
  process.exit(0);
} else {
  if (errors > 0) {
    console.error(`❌  ${errors} erreur(s) bloquante(s) trouvée(s).`);
  }
  if (warnings > 0) {
    console.warn(`⚠️   ${warnings} avertissement(s) non bloquant(s).`);
  }
  console.log();
  process.exit(errors > 0 ? 1 : 0);
}
