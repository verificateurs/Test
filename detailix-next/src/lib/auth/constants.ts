// Séparé de session.ts : ce fichier doit rester importable depuis le
// middleware (runtime Edge), qui ne peut pas charger Prisma/server-only.
export const SESSION_COOKIE = "detailix_session";

// Cookie temporaire distinct de SESSION_COOKIE : posé après vérification du
// mot de passe quand le compte a la 2FA activée, avant qu'une vraie session
// existe. Voir twoFactor.ts.
export const PENDING_2FA_COOKIE = "detailix_2fa_pending";
