// Séparé de session.ts : ce fichier doit rester importable depuis le
// middleware (runtime Edge), qui ne peut pas charger Prisma/server-only.
export const SESSION_COOKIE = "detailix_session";
