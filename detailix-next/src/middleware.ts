import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Deux responsabilités distinctes dans ce middleware Edge :
 *
 * 1. Content-Security-Policy. `script-src` inclut 'unsafe-inline' — un choix
 *    assumé, pas un oubli. Next.js injecte sur CHAQUE page (statique ou non)
 *    un script inline contenant la charge utile RSC nécessaire à
 *    l'hydratation ; sur les pages statiques (force-static/SSG, la majorité
 *    du site pour le SEO), ce HTML est figé à la build et ne peut recevoir
 *    aucun nonce par requête — un essai avec nonce + 'strict-dynamic' a été
 *    testé et bloquait purement et simplement l'hydratation de /produits/*,
 *    /panier, /commande (toutes statiques). 'unsafe-inline' est donc requis
 *    pour que le site fonctionne. Le risque réel est limité : aucun
 *    `dangerouslySetInnerHTML` dans le code ne reçoit de contenu utilisateur
 *    (seul JsonLd.tsx l'utilise, avec des données catalogue échappées) ; React
 *    échappe par défaut tout le texte/attributs rendus. Le blog (contenu
 *    admin, donc "utilisateur" au sens large) suit la même règle : Article.content
 *    est du texte brut rendu en enfants texte React (voir lib/blog.ts et
 *    /blog/[slug]), jamais interprété comme HTML — vérifié par
 *    `grep -rn dangerouslySetInnerHTML src/`, qui ne doit renvoyer que
 *    JsonLd.tsx. Toute future fonctionnalité rendant du contenu utilisateur
 *    en HTML brut invaliderait cette justification et devrait revoir la CSP.
 *    `object-src 'none'`,
 *    `base-uri 'none'` et `connect-src 'self'` restent en place comme
 *    filet de sécurité (pas d'exfiltration vers un domaine tiers, pas de
 *    détournement de <base>/plugin).
 *
 * 2. Filtre d'authentification rapide : redirige si le cookie de session est
 *    absent. Ce n'est PAS le contrôle faisant autorité — Prisma (SQLite) ne
 *    peut pas s'exécuter de façon fiable dans l'Edge runtime, donc ce
 *    middleware ne vérifie que la PRÉSENCE du cookie, jamais sa validité ni
 *    le rôle de l'utilisateur. Le contrôle réel (session valide en base +
 *    rôle) est fait par requireUser()/requireAdmin() dans compte/layout.tsx
 *    et admin/layout.tsx, qui tournent en runtime Node avec accès complet à
 *    la base — c'est ce contrôle-là qui fait foi. Ce middleware n'est qu'une
 *    optimisation pour rediriger tôt un visiteur manifestement non connecté.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "object-src 'none'",
].join("; ");

export function middleware(request: NextRequest) {
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE);
  const { pathname } = request.nextUrl;

  if (!hasSessionCookie && (pathname.startsWith("/admin") || pathname.startsWith("/compte"))) {
    const url = new URL("/connexion", request.url);
    url.searchParams.set("next", pathname);
    const response = NextResponse.redirect(url);
    response.headers.set("Content-Security-Policy", CSP);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", CSP);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
