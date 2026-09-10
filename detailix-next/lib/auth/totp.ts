import { createHmac, randomBytes } from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TIME_STEP_SECONDS_DEFAULT = 30;
const CODE_DIGITS = 6;

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(encoded: string): Buffer {
  const clean = encoded.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** Generates a new random Base32-encoded TOTP secret (20 bytes / 160 bits). */
export function generateSecret(): string {
  return base32Encode(randomBytes(20));
}

export function buildOtpauthUri(secret: string, email: string): string {
  const label = encodeURIComponent(`Detailix:${email}`);
  const issuer = encodeURIComponent("Detailix");
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`;
}

function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const counterBuf = Buffer.alloc(8);
  // Big-endian 64-bit counter (RFC 4226) — JS numbers are safe up to 2^53, far beyond any realistic counter.
  counterBuf.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  counterBuf.writeUInt32BE(counter >>> 0, 4);

  const hmac = createHmac("sha1", key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (binCode % 10 ** CODE_DIGITS).toString().padStart(CODE_DIGITS, "0");
}

export function generateTotp(secret: string, timeStepSeconds: number = TIME_STEP_SECONDS_DEFAULT): string {
  const counter = Math.floor(Date.now() / 1000 / timeStepSeconds);
  return hotp(secret, counter);
}

export function verifyTotp(secret: string, code: string, window: number = 1): boolean {
  const cleanCode = code.trim();
  if (!/^\d{6}$/.test(cleanCode)) return false;

  const counter = Math.floor(Date.now() / 1000 / TIME_STEP_SECONDS_DEFAULT);
  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    if (hotp(secret, counter + errorWindow) === cleanCode) {
      return true;
    }
  }
  return false;
}
