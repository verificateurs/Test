import * as Sentry from "@sentry/nextjs";

// Sans SENTRY_DSN (voir .env.example), Sentry.init() reste un no-op documenté
// du SDK — aucun événement envoyé, aucune erreur — même logique de mode
// démonstration explicite que Stripe/Resend/le limiteur de débit.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
