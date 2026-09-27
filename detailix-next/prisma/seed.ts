import "dotenv/config";
import { PrismaClient, Homologation } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();
const DATA = join(__dirname, "../../data");

function loadJson(name: string) {
  return JSON.parse(readFileSync(join(DATA, name), "utf8"));
}

async function main() {
  console.log("Seeding database from data/*.json ...");

  const brandsData = loadJson("brands.json");
  const categories: Array<{ id: string; label: string; description: string; brands: unknown[] }> =
    brandsData.categories;

  // BrandReview/ProductReview rows have no natural unique key in the source JSON,
  // so re-seeding would duplicate them indefinitely without this reset.
  await prisma.brandReview.deleteMany({});
  await prisma.productReview.deleteMany({});

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { label: cat.label, description: cat.description },
      create: { id: cat.id, label: cat.label, description: cat.description },
    });

    for (const b of cat.brands as Array<{
      id: string; name: string; origine: string; gamme: string;
      rating: number; reviewCount: number; recommended: boolean;
      preference: string; reviews?: Array<{ author: string; rating: number; date: string; comment: string }>;
    }>) {
      await prisma.brand.upsert({
        where: { id: b.id },
        update: {
          categoryId: cat.id, name: b.name, origine: b.origine,
          gamme: b.gamme, rating: b.rating, reviewCount: b.reviewCount,
          recommended: b.recommended, preference: b.preference,
        },
        create: {
          id: b.id, categoryId: cat.id, name: b.name, origine: b.origine,
          gamme: b.gamme, rating: b.rating, reviewCount: b.reviewCount,
          recommended: b.recommended, preference: b.preference,
        },
      });

      for (const rv of b.reviews ?? []) {
        await prisma.brandReview.create({
          data: {
            brandId: b.id,
            author: rv.author,
            rating: rv.rating,
            date: rv.date,
            comment: rv.comment,
          },
        });
      }
    }
  }

  // vehicles.json uses { name, models: [{ name, motorisations: [{ label, codeMoteur }] }] }
  const vehiclesData = loadJson("vehicles.json");
  const makes: Array<{
    name: string;
    models: Array<{
      name: string;
      motorisations: Array<{ label: string; codeMoteur: string }>;
    }>;
  }> = vehiclesData.makes;

  for (const make of makes) {
    for (const model of make.models) {
      for (const m of model.motorisations) {
        await prisma.vehicle.upsert({
          where: { codeMoteur: m.codeMoteur },
          update: { marque: make.name, modele: model.name, motorisation: m.label },
          create: {
            codeMoteur: m.codeMoteur,
            marque: make.name,
            modele: model.name,
            motorisation: m.label,
          },
        });
      }
    }
  }

  const productsData = loadJson("products.json");
  const products: Array<{
    id: string; brandId: string; categoryId: string; name: string; format: string;
    description: string; prixAchat: number; stock: boolean;
    compatibilite: string | object;
    homologation?: string;
    reviews?: Array<{ author: string; rating: number; date: string; comment: string }>;
  }> = productsData.products;

  for (const p of products) {
    const stockQty = p.stock ? 10 : 0;

    // Normalize to the {type:"universel"} | {type:"codesMoteurs",codes:[...]} JSON
    // shape expected by lib/compat.ts::parseCompatCodes — legacy source data stores
    // "universel" as a bare (non-JSON-encoded) string, which JSON.parse() rejects.
    // Anything else that is neither "universel" nor valid JSON is malformed
    // source data: it is logged and stored as-is (NOT silently rewritten to
    // "universel"), so the bug is visible instead of masked.
    let compatJson: string;
    if (typeof p.compatibilite === "string") {
      if (p.compatibilite === "universel") {
        compatJson = JSON.stringify({ type: "universel" });
      } else {
        try {
          JSON.parse(p.compatibilite);
          compatJson = p.compatibilite;
        } catch {
          console.warn(
            `[seed] Produit "${p.id}": compatibilite n'est ni "universel" ni du JSON valide ` +
            `(valeur reçue : ${JSON.stringify(p.compatibilite)}). Valeur conservée telle quelle.`
          );
          compatJson = p.compatibilite;
        }
      }
    } else {
      compatJson = JSON.stringify(p.compatibilite);
    }

    let homologation: Homologation | undefined;
    if (p.homologation === "route-ouverte") homologation = Homologation.route_ouverte;
    else if (p.homologation === "usage-piste") homologation = Homologation.usage_piste;
    else if (p.homologation === "non-applicable") homologation = Homologation.non_applicable;

    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        brandId: p.brandId, categoryId: p.categoryId, name: p.name,
        format: p.format, description: p.description, prixAchat: p.prixAchat,
        stockQty, compatibilite: compatJson, homologation,
      },
      create: {
        id: p.id, brandId: p.brandId, categoryId: p.categoryId, name: p.name,
        format: p.format, description: p.description, prixAchat: p.prixAchat,
        stockQty, compatibilite: compatJson, homologation,
      },
    });

    for (const rv of p.reviews ?? []) {
      await prisma.productReview.create({
        data: {
          productId: p.id,
          author: rv.author,
          rating: rv.rating,
          date: rv.date,
          comment: rv.comment,
        },
      });
    }
  }

  console.log("Seed termine.");
  console.log(`   ${categories.length} categories`);
  const brandCount = categories.reduce((n, c) => n + (c.brands as unknown[]).length, 0);
  console.log(`   ${brandCount} marques`);
  const vehicleCount = makes.reduce((n, mk) => n + mk.models.reduce((nn, mo) => nn + mo.motorisations.length, 0), 0);
  console.log(`   ${vehicleCount} vehicules`);
  console.log(`   ${products.length} produits`);
  const productReviewCount = products.reduce((n, p) => n + (p.reviews?.length ?? 0), 0);
  console.log(`   ${productReviewCount} avis produits`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
