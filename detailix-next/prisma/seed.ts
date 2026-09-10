import "dotenv/config";
import { PrismaClient, Homologation } from "../app/generated/prisma/client";
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
  }> = productsData.products;

  for (const p of products) {
    const stockQty = p.stock ? 10 : 0;
    const compatJson = typeof p.compatibilite === "string"
      ? p.compatibilite
      : JSON.stringify(p.compatibilite);

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
  }

  console.log("Seed termine.");
  console.log(`   ${categories.length} categories`);
  const brandCount = categories.reduce((n, c) => n + (c.brands as unknown[]).length, 0);
  console.log(`   ${brandCount} marques`);
  const vehicleCount = makes.reduce((n, mk) => n + mk.models.reduce((nn, mo) => nn + mo.motorisations.length, 0), 0);
  console.log(`   ${vehicleCount} vehicules`);
  console.log(`   ${products.length} produits`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
