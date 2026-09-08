import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /panier et /compte (à venir) n'ont aucun intérêt pour l'indexation.
      disallow: ["/panier", "/compte", "/admin"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
