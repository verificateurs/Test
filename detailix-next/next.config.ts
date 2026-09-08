import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En-têtes de sécurité statiques (remplacent le fichier _headers du site
  // vanilla). La Content-Security-Policy est posée par le middleware
  // (src/middleware.ts) car elle nécessite un nonce par requête — la poser
  // ici aussi produirait deux en-têtes CSP en conflit.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=(), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
