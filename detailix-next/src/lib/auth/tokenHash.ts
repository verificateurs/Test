import { createHash } from "node:crypto";

/**
 * Empreinte SHA-256 d'un jeton aléatoire opaque. Utilisée pour trois
 * mécanismes qui partagent le même schéma — id stocké = hash(jeton), le
 * jeton en clair ne transite jamais vers la base : session (session.ts),
 * réinitialisation de mot de passe (passwordReset.ts) et 2FA en attente
 * (totp.ts). Lire la base ne permet donc jamais de reconstituer un cookie
 * ou un lien valide.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
