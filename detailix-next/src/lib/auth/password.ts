import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

// util.promisify perd la surcharge à 4 arguments (avec options) de scrypt ;
// on enveloppe nous-mêmes pour garder un typage correct.
//
// maxmem doit être fourni explicitement : OpenSSL plafonne par défaut à 32 Mo
// (ERR_CRYPTO_INVALID_SCRYPT_PARAMS "memory limit exceeded"), or N=32768/r=8/p=1
// demande 128*N*r*p = 32 Mo tout juste — au-dessus du plafond avec l'overhead.
function scrypt(password: string, salt: Buffer, keylen: number, options: { N: number; r: number; p: number }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, { ...options, maxmem: 64 * 1024 * 1024 }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

/**
 * Hachage de mots de passe via node:crypto scrypt.
 *
 * Choix délibéré face à argon2/bcrypt : le projet n'a aujourd'hui aucune
 * dépendance native. argon2 (bindings N-API) introduit un risque de build
 * spécifique à la plateforme (résolution de binaire différente entre une
 * machine de dev et l'image de build Vercel). scrypt est intégré à Node,
 * ne peut donc jamais casser le build, pour un niveau de sécurité comparable
 * à paramètres bien choisis.
 *
 * Format stocké : "scrypt$N$r$p$<selHex>$<hashHex>" — versionné pour pouvoir
 * changer les paramètres plus tard sans invalider les hachages existants.
 */

const SCRYPT_N = 32768; // coût CPU/mémoire
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(plain, salt, KEY_LENGTH, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nStr, rStr, pStr, saltHex, hashHex] = parts;
  const N = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = await scrypt(plain, salt, expected.length, { N, r, p });

  // Longueur différente = timingSafeEqual lève ; on compare la longueur d'abord
  // (fuite d'information négligeable, la longueur du hash stocké n'est pas secrète).
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

/** Règles minimales côté serveur (source de vérité — le client peut avoir sa propre UX). */
export function isPasswordStrongEnough(plain: string): boolean {
  return typeof plain === "string" && plain.length >= 10;
}
