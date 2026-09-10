import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";

const CSRF_COOKIE = "detailix_csrf";
const CSRF_HEADER = "x-csrf-token";

export async function getOrCreateCsrfToken(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CSRF_COOKIE)?.value;
  if (existing) return existing;

  const token = randomBytes(24).toString("hex");
  jar.set(CSRF_COOKIE, token, {
    httpOnly: false,  // must be readable by JS to inject into header
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return token;
}

export async function verifyCsrf(): Promise<void> {
  const jar = await cookies();
  const headerList = await headers();
  const cookie = jar.get(CSRF_COOKIE)?.value;
  const header = headerList.get(CSRF_HEADER);

  if (!cookie || !header || cookie !== header) {
    throw new Error("CSRF token invalid");
  }
}
