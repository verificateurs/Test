"use strict";

/**
 * Lanceur de tests maison (même pattern que ../../tests/run.js pour le site
 * vanilla), adapté à detailix-next : contrairement au site statique, ici le
 * serveur (build de production + base de données seedée) doit déjà tourner
 * — voir `npm run test:e2e`, qui orchestre build/seed/start/tests/arrêt, ou
 * `BASE_URL=... node tests/run.js` pour cibler un serveur déjà en marche.
 *
 * Chaque fichier tests/*.test.js exporte { name, tests: [{ name, fn }] }.
 * fn reçoit { page, browser, baseUrl } et lève une erreur en cas d'échec.
 * Chaque test tourne dans un contexte navigateur neuf : le localStorage d'un
 * test ne fuit jamais dans le suivant.
 *
 * Usage : node tests/run.js [motif]
 */

const fs = require("node:fs");
const path = require("node:path");
const { loadPlaywright, launchOptions, BASE_URL, AssertionError } = require("./helpers");

async function main() {
  const filter = process.argv[2] || "";
  const files = fs
    .readdirSync(__dirname)
    .filter((f) => f.endsWith(".test.js"))
    .filter((f) => f.includes(filter))
    .sort();

  if (files.length === 0) {
    console.error(`Aucun fichier de test ne correspond à « ${filter} ».`);
    process.exit(1);
  }

  const { chromium } = loadPlaywright();
  const browser = await chromium.launch(launchOptions());

  let passed = 0;
  const failures = [];

  for (const file of files) {
    const suite = require(path.join(__dirname, file));
    console.log(`\n\x1b[1m${suite.name}\x1b[0m`);

    for (const test of suite.tests) {
      // Contexte neuf : isole localStorage, cookies et cache entre les tests.
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const pageErrors = [];
      page.on("pageerror", (err) => pageErrors.push(String(err)));

      try {
        await test.fn({ page, browser, baseUrl: BASE_URL });
        if (pageErrors.length > 0) {
          throw new AssertionError(`Erreur JavaScript en page :\n    ${pageErrors.join("\n    ")}`);
        }
        console.log(`  \x1b[32m✓\x1b[0m ${test.name}`);
        passed += 1;
      } catch (err) {
        console.log(`  \x1b[31m✗\x1b[0m ${test.name}`);
        console.log(`    ${err.message.split("\n").join("\n    ")}`);
        failures.push({ suite: suite.name, test: test.name, error: err });
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();

  console.log(`\n${passed} test(s) réussi(s), ${failures.length} échec(s).`);
  process.exit(failures.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Le lanceur de tests a échoué :", err);
  process.exit(1);
});
