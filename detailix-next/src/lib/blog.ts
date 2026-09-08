import { prisma } from "@/lib/prisma";

/**
 * `Article.content` est du texte brut, jamais du HTML. La séparation en
 * paragraphes se fait sur les lignes vides ; chaque paragraphe est rendu
 * comme enfant texte React (échappé automatiquement) — voir le composant de
 * la page /blog/[slug]. Aucun dangerouslySetInnerHTML n'est nécessaire ni
 * introduit pour le blog : la CSP `script-src 'self' 'unsafe-inline'`
 * (voir middleware.ts) reste justifiée par l'absence de contenu utilisateur
 * injecté en HTML brut sur tout le site.
 */
export function articleParagraphs(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export async function getArticles() {
  return prisma.article.findMany({ orderBy: { publishedAt: "desc" } });
}

export async function getArticle(slug: string) {
  return prisma.article.findUnique({ where: { slug } });
}
