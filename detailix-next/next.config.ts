import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // En-têtes de sécurité statiques (remplacent le fichier _headers du site
  // vanilla). La Content-Security-Policy est posée par le middleware
  // (src/middleware.ts) car elle nécessite un nonce par requête — la poser
  // ici aussi produirait deux en-têtes CSP en conflit.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=(), payment=()" },
        ],
      },
    ];
  },
};

// Sentry n'enveloppe la config qu'avec un DSN renseigné (voir .env.example) :
// sans lui, `nextConfig` part inchangé et le build n'a strictement aucune
// dépendance à Sentry — même logique de mode démonstration explicite que
// Stripe/Resend, ici appliquée dès la config de build plutôt qu'à l'exécution.
// Le tunnel same-origin (éviter d'ajouter le domaine d'ingestion Sentry à
// connect-src dans la CSP, src/middleware.ts) N'EST PAS géré par l'option
// `tunnelRoute` ci-dessous : elle repose sur le plugin webpack de Sentry,
// sans effet sous Turbopack (bundler utilisé ici pour `next build` — vérifié
// en observant `withSentryConfig` ne rien injecter dans la table des routes
// avec un DSN factice). Le tunnel réel est câblé indépendamment du bundler,
// via `tunnel: "/monitoring"` dans Sentry.init() (instrumentation-client.ts)
// et une route écrite à la main (src/app/monitoring/route.ts).
export default process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      widenClientFileUpload: true,
    })
  : nextConfig;
