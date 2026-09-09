import "server-only";
import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";

/**
 * TOTP maison (RFC 6238, HMAC-SHA1, node:crypto) — cohérent avec le choix déjà
 * fait pour le hachage de mot de passe (password.ts) : aucune dépendance
 * native, aucun risque de build spécifique à une plateforme. HMAC-SHA1 (et
 * non SHA-256) parce que c'est l'algorithme par défaut lu par toutes les
 * applications d'authentification (Google Authenticator, Authy...) sans
 * paramètre explicite.
 */

const STEP_SECONDS = 30;
const DIGITS = 6;
const SECRET_BYTES = 20; // 160 bits, taille recommandée par la RFC pour HMAC-SHA1
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue; // ignore les caractères de mise en forme (espaces, tirets)
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** HOTP (RFC 4226) : le compteur est ici le pas de temps TOTP. */
function hotp(secret: Buffer, counter: number): string {
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", secret).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  return String(code % 10 ** DIGITS).padStart(DIGITS, "0");
}

function timeStep(timeMs: number): number {
  return Math.floor(timeMs / 1000 / STEP_SECONDS);
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(SECRET_BYTES));
}

export function generateTotpCode(base32Secret: string, timeMs: number = Date.now()): string {
  return hotp(base32Decode(base32Secret), timeStep(timeMs));
}

/**
 * Tolère une dérive d'un pas de temps (±30s) pour absorber un décalage
 * d'horloge raisonnable côté client, sans élargir la fenêtre au point de
 * rendre un code rejouable longtemps après son affichage.
 */
export function verifyTotpCode(base32Secret: string, code: string, timeMs: number = Date.now()): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const secret = base32Decode(base32Secret);
  const counter = timeStep(timeMs);
  const codeBuf = Buffer.from(code);
  for (const drift of [0, -1, 1]) {
    const expected = Buffer.from(hotp(secret, counter + drift));
    if (timingSafeEqual(expected, codeBuf)) return true;
  }
  return false;
}

export function totpUri(base32Secret: string, accountLabel: string, issuer = "Detailix"): string {
  const label = encodeURIComponent(`${issuer}:${accountLabel}`);
  const params = new URLSearchParams({
    secret: base32Secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
