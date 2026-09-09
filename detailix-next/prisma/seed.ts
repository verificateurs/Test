/**
 * Seed de la base à partir des données du prototype vanilla (../data/*.json).
 *
 * Source unique de vérité pour le catalogue tant que le back-office (module 5)
 * n'écrit pas encore en base. Idempotent : on vide puis on recharge.
 *
 * Lancé via `npm run db:seed`. Node exécute le TypeScript directement
 * (--experimental-strip-types) : aucune étape de compilation.
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { hashPassword } from "../src/lib/auth/password.ts";

const prisma = new PrismaClient();
const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "data");

// data/products.json (partagé avec le site vanilla) ne connaît qu'un booléen
// "en stock" — jamais une quantité réelle. Valeur de démarrage raisonnable,
// dupliquée depuis lib/catalogue.ts::FALLBACK_IN_STOCK_QTY (ce script tourne
// via `node --experimental-strip-types`, sans résolution de l'alias "@/" que
// ce fichier utilise en interne — voir l'import relatif de hashPassword
// ci-dessous pour la même raison).
const FALLBACK_IN_STOCK_QTY = 25;

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, name), "utf8")) as T;
}

type BrandsFile = {
  categories: Array<{
    id: string;
    label: string;
    description: string;
    brands: Array<{
      id: string;
      name: string;
      origine: string;
      gamme: string;
      rating: number;
      reviewCount: number;
      recommended: boolean;
      preference: string;
      reviews: Array<{ author: string; rating: number; date: string; comment: string }>;
    }>;
  }>;
};

type ProductsFile = {
  products: Array<{
    id: string;
    brandId: string;
    categoryId: string;
    name: string;
    format: string;
    description: string;
    prixAchat: number;
    stock: boolean;
    compatibilite: unknown;
    homologation?: string;
  }>;
};

type VehiclesFile = {
  makes: Array<{
    id: string;
    name: string;
    models: Array<{
      id: string;
      name: string;
      motorisations: Array<{ id: string; label: string; codeMoteur: string }>;
    }>;
  }>;
};

type PricingFile = { marginPercent: number; currency: string };

async function main() {
  const brandsFile = readJson<BrandsFile>("brands.json");
  const productsFile = readJson<ProductsFile>("products.json");
  const vehiclesFile = readJson<VehiclesFile>("vehicles.json");
  const pricing = readJson<PricingFile>("pricing-config.json");

  // Purge dans l'ordre des dépendances (les OrderLine/Order ne référencent pas
  // encore de produits en seed, mais on reste défensif pour les re-seeds).
  await prisma.orderLine.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.vehicleMotorisation.deleteMany();
  await prisma.vehicleModel.deleteMany();
  await prisma.vehicleMake.deleteMany();

  // Catégories + marques + avis
  for (const [position, cat] of brandsFile.categories.entries()) {
    await prisma.category.create({
      data: { id: cat.id, label: cat.label, description: cat.description, position },
    });
    for (const brand of cat.brands) {
      await prisma.brand.create({
        data: {
          id: brand.id,
          name: brand.name,
          origine: brand.origine,
          gamme: brand.gamme,
          rating: brand.rating,
          reviewCount: brand.reviewCount,
          recommended: brand.recommended,
          preference: brand.preference,
          categoryId: cat.id,
          reviews: {
            create: brand.reviews.map((r) => ({
              author: r.author,
              rating: r.rating,
              date: r.date,
              comment: r.comment,
            })),
          },
        },
      });
    }
  }

  // Produits — compatibilite sérialisée en chaîne JSON pour SQLite
  for (const p of productsFile.products) {
    await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        format: p.format,
        description: p.description,
        prixAchat: p.prixAchat,
        stockQty: p.stock ? FALLBACK_IN_STOCK_QTY : 0,
        compatibilite: typeof p.compatibilite === "string" ? p.compatibilite : JSON.stringify(p.compatibilite),
        homologation: p.homologation ?? null,
        brandId: p.brandId,
        categoryId: p.categoryId,
      },
    });
  }

  // Véhicules
  for (const make of vehiclesFile.makes) {
    await prisma.vehicleMake.create({ data: { id: make.id, name: make.name } });
    for (const model of make.models) {
      await prisma.vehicleModel.create({ data: { id: model.id, name: model.name, makeId: make.id } });
      for (const motor of model.motorisations) {
        await prisma.vehicleMotorisation.create({
          data: { id: motor.id, label: motor.label, codeMoteur: motor.codeMoteur, modelId: model.id },
        });
      }
    }
  }

  // Réglages (marge globale) — la source de vérité du prix de vente
  await prisma.setting.upsert({
    where: { key: "marginPercent" },
    create: { key: "marginPercent", value: String(pricing.marginPercent) },
    update: { value: String(pricing.marginPercent) },
  });
  await prisma.setting.upsert({
    where: { key: "freeShippingThreshold" },
    create: { key: "freeShippingThreshold", value: "79" },
    update: {},
  });
  await prisma.setting.upsert({
    where: { key: "proDiscountPercent" },
    create: { key: "proDiscountPercent", value: "15" },
    update: {},
  });

  // Code promo de démonstration pour tester le tunnel de commande.
  await prisma.promoCode.upsert({
    where: { code: "BIENVENUE10" },
    create: { code: "BIENVENUE10", type: "PERCENT", value: 10, minSubtotal: 0, freeShipping: false, active: true },
    update: {},
  });

  // Articles de démonstration pour le blog.
  const articles = [
    {
      slug: "bien-choisir-son-polish",
      title: "Bien choisir son polish selon l'état de sa carrosserie",
      excerpt: "Abrasif, finition, protection : comment s'y retrouver avant un polissage.",
      content:
        "Le choix d'un polish dépend d'abord de l'état réel de la carrosserie, pas de la promesse marketing du produit.\n\nSur une peinture peu marquée, un polish de finition à grain fin suffit à raviver l'éclat sans retirer de matière inutilement.\n\nSur des hologrammes ou des micro-rayures plus profondes, un abrasif intermédiaire est nécessaire avant de repasser en finition, sous peine de laisser les défauts visibles sous certains angles de lumière.\n\nDans tous les cas, un test sur une zone peu visible reste la meilleure façon de valider la combinaison produit/pad avant de traiter l'ensemble du véhicule.",
    },
    {
      slug: "entretien-jantes-hiver",
      title: "Entretien des jantes en hiver : ce qui change vraiment",
      excerpt: "Sel de déneigement, poussière de frein, gel : adapter sa routine au lieu de la multiplier.",
      content:
        "Le sel de déneigement accélère la corrosion sur les jantes non protégées, en particulier au niveau des fixations et des zones déjà micro-rayées.\n\nUn rinçage plus fréquent qu'en été, même sommaire, limite le temps de contact entre le sel et le métal — c'est ce facteur temps qui fait la différence, plus que le produit utilisé.\n\nUne protection céramique ou un scellant appliqué en amont de la saison facilite ce rinçage rapide en empêchant les résidus de s'incruster dans les micro-aspérités.",
    },
  ];
  for (const article of articles) {
    await prisma.article.upsert({ where: { slug: article.slug }, create: article, update: article });
  }

  // Bootstrap admin optionnel : une base fraîche n'a aucun utilisateur, donc
  // le back-office est inatteignable tant que personne n'a de compte ADMIN.
  // Activé uniquement si les deux variables sont fournies — silencieux sinon,
  // pour ne jamais créer de compte avec un mot de passe par défaut deviné.
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const passwordHash = await hashPassword(adminPassword);
    await prisma.user.upsert({
      where: { email: adminEmail },
      create: { email: adminEmail, passwordHash, displayName: "Administrateur", role: "ADMIN" },
      update: { passwordHash, role: "ADMIN" },
    });
    console.log(`Compte admin initialisé : ${adminEmail}`);
  }

  const counts = {
    catégories: await prisma.category.count(),
    marques: await prisma.brand.count(),
    produits: await prisma.product.count(),
    avis: await prisma.review.count(),
    "codes moteur": await prisma.vehicleMotorisation.count(),
  };
  console.log("Seed terminé :", Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", "));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
