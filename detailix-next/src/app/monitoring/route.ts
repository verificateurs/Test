import { handleTunnelRequest } from "@sentry/core";

/**
 * Tunnel Sentry côté client (voir src/instrumentation-client.ts, option
 * `tunnel`), pour ne pas élargir connect-src 'self' dans la CSP
 * (src/middleware.ts) — le client envoie ses événements ici plutôt que
 * directement vers le domaine d'ingestion Sentry.
 *
 * withSentryConfig() propose une option `tunnelRoute` qui génère cette route
 * automatiquement, mais uniquement via son plugin webpack — sans effet sous
 * Turbopack (bundler utilisé ici pour `next build`, voir README.md
 * "Limites connues"). Cette route est donc écrite à la main avec le helper
 * officiel framework-agnostic de @sentry/core, qui valide le DSN encodé
 * dans l'enveloppe tunnelée contre `allowedDsns` avant de relayer vers
 * Sentry — sans cette validation, la route serait un relais ouvert
 * utilisable pour exfiltrer des requêtes vers un service tiers arbitraire.
 */
export async function POST(request: Request): Promise<Response> {
  const allowedDsns = [process.env.NEXT_PUBLIC_SENTRY_DSN, process.env.SENTRY_DSN].filter(
    (dsn): dsn is string => !!dsn
  );
  if (allowedDsns.length === 0) return new Response(null, { status: 404 });

  return handleTunnelRequest({ request, allowedDsns });
}
