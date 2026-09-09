// Intentionnellement vide — sert de cible d'alias pour "server-only" (voir
// vitest.config.ts). Le vrai paquet "server-only" lève une exception dès son
// exécution ; ce n'est un no-op que sous le bundler webpack de Next.js, qui
// le reconnaît spécialement. Vitest n'a pas ce traitement, donc importer un
// module serveur (ex. lib/checkout/pricing.ts) planterait sans cet alias.
export {};
