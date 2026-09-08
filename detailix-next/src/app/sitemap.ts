import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getVehiclePages } from "@/lib/vehicles";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, brands, products] = await Promise.all([
    prisma.category.findMany({ select: { id: true } }),
    prisma.brand.findMany({ select: { id: true } }),
    prisma.product.findMany({ select: { id: true } }),
  ]);
  const vehiclePages = await getVehiclePages();

  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), priority: 1 },
    { url: absoluteUrl("/categories"), priority: 0.8 },
    { url: absoluteUrl("/marques"), priority: 0.6 },
    { url: absoluteUrl("/vehicules"), priority: 0.8 },
    ...categories.map((c) => ({ url: absoluteUrl(`/categories/${c.id}`), priority: 0.7 })),
    ...brands.map((b) => ({ url: absoluteUrl(`/marques/${b.id}`), priority: 0.5 })),
    ...products.map((p) => ({ url: absoluteUrl(`/produits/${p.id}`), priority: 0.7 })),
    // Les pages véhicule dupliquées sont noindex : on les exclut du sitemap.
    ...vehiclePages.filter((v) => !v.isDuplicate).map((v) => ({ url: absoluteUrl(`/vehicules/${v.slug}`), priority: 0.6 })),
  ];
  return entries;
}
