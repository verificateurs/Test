import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Tests unitaires rapides (logique pure), complémentaires à la suite
 * Playwright de bout en bout dans tests/ (npm run test:e2e — base jetable,
 * build complet, ~10 min par run). Glob volontairement restreint à
 * src/**\/*.spec.ts : tests/*.test.js est le harnais Playwright fait maison
 * (tests/run.js), pas des fichiers Vitest — les deux suites doivent rester
 * étanches l'une de l'autre.
 *
 * DATABASE_URL factice : des modules comme lib/catalogue.ts importent
 * lib/prisma.ts au niveau module ; PrismaClient() valide la présence de la
 * variable d'environnement dès sa construction (avant toute requête), donc
 * son absence ferait échouer l'import même pour tester une fonction pure du
 * même fichier qui ne touche jamais la base.
 */
export default defineConfig({
  resolve: {
    alias: {
      // "server-only" lève une exception à l'exécution ; ce n'est un no-op
      // que sous le bundler de Next.js, qui le reconnaît spécialement.
      // Vitest n'a pas ce traitement — voir vitest.setup.ts.
      "server-only": fileURLToPath(new URL("./vitest.setup.ts", import.meta.url)),
      // Vitest ne lit pas tsconfig.json > compilerOptions.paths tout seul.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.spec.ts"],
    exclude: ["tests/**", "node_modules/**", ".next/**"],
    environment: "node",
    env: {
      DATABASE_URL: "file:./vitest-dummy.db",
    },
  },
});
