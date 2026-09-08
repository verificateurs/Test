import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En-têtes de sécurité appliqués côté serveur (remplacent le fichier _headers
  // du site vanilla). frame-ancestors et HSTS n'ont d'effet qu'en en-tête HTTP.
  async headers() {
    const csp = [
      "default-src 'self'",
      // Next injecte des scripts d'hydratation ; en production ils ne sont pas
      // inline arbitraires mais Next requiert 'unsafe-inline' pour ses styles.
      // Le durcissement par nonce sera fait au module 4 (middleware).
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data:",
      "connect-src 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "base-uri 'none'",
      "object-src 'none'",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=(), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
