import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Deux responsabilités distinctes dans ce middleware Edge :
 *
 * 1. CSP par nonce — un nonce aléatoire est généré à chaque requête, transmis
 *    à Next via l'en-tête `x-nonce` (Next l'applique automatiquement aux
 *    scripts d'hydratation qu'il injecte) et posé sur l'en-tête de réponse
 *    Content-Security-Policy. Sans ça, `script-src 'self'` bloque les scripts
 *    inline générés par Next lui-même (état RSC, hydratation) et casse le
 *    montage de toute île cliente sur le site — pas seulement l'admin.
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
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "object-src 'none'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const hasSessionCookie = request.cookies.has(SESSION_COOKIE);
  const { pathname } = request.nextUrl;

  if (!hasSessionCookie && (pathname.startsWith("/admin") || pathname.startsWith("/compte"))) {
    const url = new URL("/connexion", request.url);
    url.searchParams.set("next", pathname);
    const response = NextResponse.redirect(url);
    response.headers.set("Content-Security-Policy", csp);
    return response;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
