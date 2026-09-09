import * as Sentry from "@sentry/nextjs";

// Variante publique (NEXT_PUBLIC_) du même DSN, requise pour atteindre le
// bundle navigateur — voir .env.example. Sans elle, no-op documenté du SDK.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  // Passe par src/app/monitoring/route.ts (same-origin) plutôt que par le
  // domaine d'ingestion Sentry, pour ne pas élargir connect-src 'self' dans
  // la CSP (src/middleware.ts). Réglage indépendant du bundler (contrairement
  // à l'option `tunnelRoute` de withSentryConfig, sans effet sous Turbopack).
  tunnel: "/monitoring",
});

// Requis par le SDK pour instrumenter les transitions de route côté client.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
