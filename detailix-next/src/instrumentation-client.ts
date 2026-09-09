import * as Sentry from "@sentry/nextjs";

// Variante publique (NEXT_PUBLIC_) du même DSN, requise pour atteindre le
// bundle navigateur — voir .env.example. Sans elle, no-op documenté du SDK.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
