import type { MetadataRoute } from "next";

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // The catalog is public and crawlable, including the OG/JSON-LD product images
      // served from /api/product-image/* — only that sub-path is re-allowed, /api stays
      // disallowed for everything else (search index, internal endpoints, etc).
      allow: ["/", "/api/product-image/"],
      disallow: [
        "/admin",
        "/compte",
        "/commande",
        "/api",
        "/connexion",
        "/inscription",
        "/mot-de-passe-oublie",
        "/reinitialiser-mot-de-passe",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
