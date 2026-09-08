#!/usr/bin/env node
"use strict";

/**
 * Valide les fichiers data/*.json : structure, typage, unicité et intégrité
 * référentielle. Lancé en CI (`npm run validate`) et avant chaque commit
 * touchant au catalogue.
 *
 * Sortie 0 = catalogue sain. Sortie 1 = au moins une erreur bloquante.
 */

const fs = require("node:fs");
const path = require("node:path");

const DATA_DIR = path.resolve(__dirname, "..", "data");

const LIMITS = {
  maxCategories: 50,
  maxBrands: 2000,
  maxProducts: 5000,
  maxReviewsPerBrand: 50,
  maxNameLength: 200,
  maxTextLength: 2000,
  maxPrixAchat: 100000,
};

const HOMOLOGATIONS = ["route-ouverte", "usage-piste", "non-applicable"];

const errors = [];
const warnings = [];

const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

const isKebabCase = (s) => typeof s === "string" && /^[a-z0-9]+(?:[-.][a-z0-9]+)*$/.test(s);
const isText = (s, max) => typeof s === "string" && s.length > 0 && s.length <= max;
const isFiniteNumber = (n) => typeof n === "number" && Number.isFinite(n);

function readJson(name) {
  const file = path.join(DATA_DIR, name);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    fail(`${name} : illisible ou JSON invalide — ${err.message}`);
    return null;
  }
}

/* ---------- brands.json ---------- */

function validateBrands(data) {
  if (!data || !Array.isArray(data.categories)) {
    fail("brands.json : la clé « categories » doit être un tableau");
    return { categoryIds: new Set(), brandsByCategory: new Map(), brandIds: new Set() };
  }

  const categoryIds = new Set();
  const brandIds = new Set();
  const brandsByCategory = new Map();

  if (data.categories.length > LIMITS.maxCategories) fail(`brands.json : plus de ${LIMITS.maxCategories} catégories`);

  data.categories.forEach((cat, i) => {
    const where = `brands.json › catégorie #${i} (${cat && cat.id})`;
    if (!isKebabCase(cat.id)) fail(`${where} : « id » doit être en kebab-case`);
    if (categoryIds.has(cat.id)) fail(`${where} : identifiant de catégorie en double`);
    categoryIds.add(cat.id);

    if (!isText(cat.label, LIMITS.maxNameLength)) fail(`${where} : « label » manquant ou trop long`);
    if (!isText(cat.description, LIMITS.maxTextLength)) fail(`${where} : « description » manquante ou trop longue`);
    if (!Array.isArray(cat.brands)) {
      fail(`${where} : « brands » doit être un tableau`);
      return;
    }

    cat.brands.forEach((brand, j) => {
      const bw = `${where} › marque #${j} (${brand && brand.id})`;
      if (!isKebabCase(brand.id)) fail(`${bw} : « id » doit être en kebab-case`);

      // Unicité GLOBALE et non par catégorie : le code fait
      // categories.flatMap(c => c.brands).find(...) et productsForBrand(brandId).
      // Un doublon casserait silencieusement l'affectation produit → marque.
      if (brandIds.has(brand.id)) fail(`${bw} : identifiant de marque déjà utilisé ailleurs (doit être unique globalement)`);
      brandIds.add(brand.id);
      brandsByCategory.set(brand.id, cat.id);

      if (!isText(brand.name, LIMITS.maxNameLength)) fail(`${bw} : « name » manquant`);
      if (!isText(brand.origine, LIMITS.maxNameLength)) fail(`${bw} : « origine » manquante`);
      if (!isText(brand.gamme, LIMITS.maxNameLength)) fail(`${bw} : « gamme » manquante`);
      if (!isText(brand.preference, LIMITS.maxTextLength)) fail(`${bw} : « preference » manquante`);
      if (!isFiniteNumber(brand.rating) || brand.rating < 0 || brand.rating > 5) fail(`${bw} : « rating » doit être entre 0 et 5`);
      if (!Number.isInteger(brand.reviewCount) || brand.reviewCount < 0) fail(`${bw} : « reviewCount » doit être un entier ≥ 0`);
      if (typeof brand.recommended !== "boolean") fail(`${bw} : « recommended » doit être un booléen`);

      if (!Array.isArray(brand.reviews)) {
        fail(`${bw} : « reviews » doit être un tableau`);
        return;
      }
      if (brand.reviews.length > LIMITS.maxReviewsPerBrand) fail(`${bw} : trop d'avis`);
      brand.reviews.forEach((review, k) => {
        const rw = `${bw} › avis #${k}`;
        if (!isText(review.author, LIMITS.maxNameLength)) fail(`${rw} : « author » manquant`);
        if (!Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) fail(`${rw} : « rating » doit être un entier de 1 à 5`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(review.date)) fail(`${rw} : « date » doit être au format AAAA-MM-JJ`);
        if (!isText(review.comment, LIMITS.maxTextLength)) fail(`${rw} : « comment » manquant`);
      });
    });
  });

  return { categoryIds, brandsByCategory, brandIds };
}

/* ---------- vehicles.json ---------- */

function validateVehicles(data) {
  const codesMoteur = new Set();
  if (!data || !Array.isArray(data.makes)) {
    fail("vehicles.json : la clé « makes » doit être un tableau");
    return codesMoteur;
  }

  const makeIds = new Set();
  data.makes.forEach((make, i) => {
    const where = `vehicles.json › marque #${i} (${make && make.id})`;
    if (!isKebabCase(make.id)) fail(`${where} : « id » doit être en kebab-case`);
    if (makeIds.has(make.id)) fail(`${where} : identifiant de marque véhicule en double`);
    makeIds.add(make.id);
    if (!isText(make.name, LIMITS.maxNameLength)) fail(`${where} : « name » manquant`);
    if (!Array.isArray(make.models)) {
      fail(`${where} : « models » doit être un tableau`);
      return;
    }

    const modelIds = new Set();
    make.models.forEach((model, j) => {
      const mw = `${where} › modèle #${j} (${model && model.id})`;
      if (!isKebabCase(model.id)) fail(`${mw} : « id » doit être en kebab-case`);
      if (modelIds.has(model.id)) fail(`${mw} : identifiant de modèle en double`);
      modelIds.add(model.id);
      if (!isText(model.name, LIMITS.maxNameLength)) fail(`${mw} : « name » manquant`);
      if (!Array.isArray(model.motorisations) || model.motorisations.length === 0) {
        fail(`${mw} : « motorisations » doit être un tableau non vide`);
        return;
      }
      model.motorisations.forEach((motor, k) => {
        const tw = `${mw} › motorisation #${k} (${motor && motor.id})`;
        if (!isKebabCase(motor.id)) fail(`${tw} : « id » doit être en kebab-case`);
        if (!isText(motor.label, LIMITS.maxNameLength)) fail(`${tw} : « label » manquant`);
        if (!isText(motor.codeMoteur, 40)) fail(`${tw} : « codeMoteur » manquant`);
        else codesMoteur.add(motor.codeMoteur);
      });
    });
  });

  return codesMoteur;
}

/* ---------- products.json ---------- */

function validateProducts(data, { categoryIds, brandsByCategory }, codesMoteur) {
  if (!data || !Array.isArray(data.products)) {
    fail("products.json : la clé « products » doit être un tableau");
    return;
  }
  if (data.products.length > LIMITS.maxProducts) fail(`products.json : plus de ${LIMITS.maxProducts} produits`);

  const productIds = new Set();

  data.products.forEach((p, i) => {
    const where = `products.json › produit #${i} (${p && p.id})`;
    if (!isKebabCase(p.id)) fail(`${where} : « id » doit être en kebab-case`);
    if (productIds.has(p.id)) fail(`${where} : identifiant produit en double`);
    productIds.add(p.id);

    if (!isText(p.name, LIMITS.maxNameLength)) fail(`${where} : « name » manquant`);
    if (!isText(p.format, LIMITS.maxNameLength)) fail(`${where} : « format » manquant`);
    if (!isText(p.description, LIMITS.maxTextLength)) fail(`${where} : « description » manquante`);

    if (!isFiniteNumber(p.prixAchat) || p.prixAchat < 0 || p.prixAchat > LIMITS.maxPrixAchat) {
      fail(`${where} : « prixAchat » doit être un nombre entre 0 et ${LIMITS.maxPrixAchat}`);
    }

    // Booléen STRICT : compatibilityStatus et deliveryEstimate testent `=== false`.
    // Une chaîne "false" afficherait « Expédié sous 24h » sur un produit en rupture.
    if (typeof p.stock !== "boolean") fail(`${where} : « stock » doit être un booléen strict (true/false, sans guillemets)`);

    // Intégrité référentielle marque / catégorie
    if (!brandsByCategory.has(p.brandId)) {
      fail(`${where} : « brandId » ${JSON.stringify(p.brandId)} ne correspond à aucune marque`);
    } else if (brandsByCategory.get(p.brandId) !== p.categoryId) {
      fail(
        `${where} : « categoryId » ${JSON.stringify(p.categoryId)} ne correspond pas à la catégorie ` +
          `${JSON.stringify(brandsByCategory.get(p.brandId))} de sa marque`
      );
    }
    if (!categoryIds.has(p.categoryId)) fail(`${where} : « categoryId » ${JSON.stringify(p.categoryId)} inconnu`);

    // Compatibilité véhicule
    if (p.compatibilite === "universel") {
      // rien à vérifier
    } else if (p.compatibilite && p.compatibilite.type === "codesMoteurs") {
      if (!Array.isArray(p.compatibilite.codes) || p.compatibilite.codes.length === 0) {
        fail(`${where} : « compatibilite.codes » doit être un tableau non vide`);
      } else {
        p.compatibilite.codes.forEach((code) => {
          // Non bloquant : un code peut légitimement précéder l'ajout du véhicule.
          if (!codesMoteur.has(code)) warn(`${where} : code moteur ${JSON.stringify(code)} absent de vehicles.json`);
        });
      }
    } else {
      fail(`${where} : « compatibilite » doit valoir "universel" ou {type:"codesMoteurs", codes:[…]}`);
    }

    // Mention réglementaire (§11 du cahier des charges) — facultative, mais si
    // présente elle doit être l'une des valeurs prévues.
    if (p.homologation !== undefined && !HOMOLOGATIONS.includes(p.homologation)) {
      fail(`${where} : « homologation » doit valoir ${HOMOLOGATIONS.join(", ")}`);
    }
  });
}

/* ---------- pricing-config.json ---------- */

function validatePricing(data) {
  if (!data || typeof data !== "object") {
    fail("pricing-config.json : objet attendu");
    return;
  }
  if (!isFiniteNumber(data.marginPercent) || data.marginPercent < 0 || data.marginPercent > 1000) {
    fail("pricing-config.json : « marginPercent » doit être un nombre entre 0 et 1000");
  }
  // formatPrice code la devise EUR en dur (assets/pricing.js).
  if (data.currency !== "EUR") fail("pricing-config.json : « currency » doit valoir \"EUR\"");
}

/* ---------- Exécution ---------- */

const brands = readJson("brands.json");
const products = readJson("products.json");
const vehicles = readJson("vehicles.json");
const pricing = readJson("pricing-config.json");

const brandIndex = validateBrands(brands);
const codesMoteur = validateVehicles(vehicles);
validateProducts(products, brandIndex, codesMoteur);
validatePricing(pricing);

const counts = {
  catégories: brands && brands.categories ? brands.categories.length : 0,
  marques: brandIndex.brandIds.size,
  produits: products && products.products ? products.products.length : 0,
  "codes moteur": codesMoteur.size,
};

console.log("Catalogue :", Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", "));

warnings.forEach((w) => console.log(`\x1b[33m!\x1b[0m ${w}`));

if (errors.length > 0) {
  console.log("");
  errors.forEach((e) => console.log(`\x1b[31m✗\x1b[0m ${e}`));
  console.log(`\n${errors.length} erreur(s) bloquante(s).`);
  process.exit(1);
}

console.log(`\x1b[32m✓\x1b[0m Catalogue valide${warnings.length ? ` (${warnings.length} avertissement(s))` : ""}.`);
