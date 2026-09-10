import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(plain, salt, KEYLEN)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [salt, storedHash] = stored.split(":");
  if (!salt || !storedHash) return false;
  try {
    const hash = (await scryptAsync(plain, salt, KEYLEN)) as Buffer;
    const storedBuf = Buffer.from(storedHash, "hex");
    return hash.length === storedBuf.length && timingSafeEqual(hash, storedBuf);
  } catch {
    return false;
  }
}
