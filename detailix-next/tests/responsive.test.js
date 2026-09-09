"use strict";

const { assert } = require("./helpers");

/**
 * Garde-fou anti-débordement mobile, distinct de l'audit visuel ponctuel
 * (captures 375/768/1280px, non committé). `clientWidth`, pas
 * `window.innerWidth` : ce dernier inclut la gouttière de la barre de
 * défilement et ferait échouer à tort dès qu'une page scrolle normalement
 * verticalement.
 */
async function assertNoHorizontalOverflow(page, baseUrl, path) {
  await page.goto(`${baseUrl}${path}`, { waitUntil: "load" });
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  assert(scrollWidth <= clientWidth, `débordement horizontal sur ${path} (scrollWidth=${scrollWidth} > clientWidth=${clientWidth})`);
}

module.exports = {
  name: "Responsive — pas de débordement horizontal mobile",
  tests: [
    {
      name: "la page d'accueil ne déborde pas horizontalement à 375px",
      fn: async ({ browser, baseUrl }) => {
        const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
        const page = await context.newPage();
        await assertNoHorizontalOverflow(page, baseUrl, "/");
        await context.close();
      },
    },
    {
      name: "une fiche produit ne déborde pas horizontalement à 375px",
      fn: async ({ browser, baseUrl }) => {
        const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
        const page = await context.newPage();
        await assertNoHorizontalOverflow(page, baseUrl, "/produits/meguiars-shampoing-gold-class");
        await context.close();
      },
    },
  ],
};
