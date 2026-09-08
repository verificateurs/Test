import path from "node:path";
import { loadEnvFile } from "node:process";
import type { PrismaConfig } from "prisma";

// Prisma >= 6.7 charge un prisma.config.ts s'il existe, mais désactive alors
// son chargement automatique de .env ("Prisma config detected, skipping
// environment variable loading") — on le recharge nous-mêmes explicitement.
try {
  loadEnvFile(path.join(__dirname, ".env"));
} catch {
  // .env absent (ex. en CI où les variables sont injectées autrement) : pas bloquant.
}

export default {
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "node --experimental-strip-types prisma/seed.ts",
  },
} satisfies PrismaConfig;
