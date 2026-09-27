import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

// Re-generate the sitemap at most once an hour so newly created products/brands
// show up without needing a full rebuild, while still benefiting from caching.
export const revalidate = 3600;

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, brands, categories] = await Promise.all([
    db.product.findMany({ select: { id: true } }),
    db.brand.findMany({ select: { id: true } }),
    db.category.findMany({ select: { id: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/preparateurs`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/mentions-legales`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE_URL}/cgv`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE_URL}/confidentialite`, changeFrequency: "yearly", priority: 0.1 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/categories/${c.id}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const brandRoutes: MetadataRoute.Sitemap = brands.map((b) => ({
    url: `${BASE_URL}/marques/${b.id}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/produits/${p.id}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...categoryRoutes, ...brandRoutes, ...productRoutes];
}
