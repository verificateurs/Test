import { type NextRequest, NextResponse } from "next/server";

const CSP = [
  "default-src 'self'",
  // Google Fonts via CSS @import — requires styles/fonts.googleapis.com
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // Images: self + data: (placeholder SVG)
  "img-src 'self' data:",
  // AJAX: self only
  "connect-src 'self'",
  // No scripts from third parties
  "script-src 'self'",
  // No plugins, frames
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

export function proxy(req: NextRequest) {
  // Next.js needs a per-request nonce for its inline hydration payload.
  const nonce = btoa(crypto.randomUUID());
  const csp = CSP.replace("style-src 'self' https://fonts.googleapis.com", `style-src 'self' https://fonts.googleapis.com 'nonce-${nonce}'`)
    .replace("script-src 'self'", `script-src 'self' 'nonce-${nonce}'`);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const res = NextResponse.next({ request: { headers: requestHeaders } });

  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  return res;
}

export const config = {
  matcher: [
    // Apply to all routes except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
