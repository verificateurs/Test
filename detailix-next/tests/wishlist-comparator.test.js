"use strict";

const { assert, assertEqual } = require("./helpers");

const PRODUCT_ID = "303-aerospace-protectant";
const PRODUCT_NAME = "Aerospace Protectant";

module.exports = {
  name: "Liste d'envies et comparateur",
  tests: [
    {
      name: "un visiteur anonyme voit une invite de connexion, un client peut ajouter/retirer un produit",
      fn: async ({ page, browser, baseUrl }) => {
        const anonContext = await browser.newContext();
        const anonPage = await anonContext.newPage();
        await anonPage.goto(`${baseUrl}/produits/${PRODUCT_ID}`, { waitUntil: "load" });
        await anonPage.waitForTimeout(300);
        const anonBody = await anonPage.$eval("body", (el) => el.textContent);
        assert(anonBody.includes("Se connecter pour ajouter"), "un visiteur anonyme doit voir une invite de connexion, pas le bouton d'ajout");
        await anonContext.close();

        const email = `wishlist-${Date.now()}@example.com`;
        await page.goto(`${baseUrl}/inscription`, { waitUntil: "load" });
        await page.fill('input[name="displayName"]', "Wishlist Test");
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', "motdepasse-solide-123");
        await page.click('button[type="submit"]');
        await page.waitForURL("**/compte", { timeout: 8000 });

        await page.goto(`${baseUrl}/produits/${PRODUCT_ID}`, { waitUntil: "load" });
        await page.waitForTimeout(300);
        await page.click('button:has-text("Ajouter à ma liste d\'envies")');
        await page.waitForTimeout(500);

        await page.goto(`${baseUrl}/compte/liste-envies`, { waitUntil: "load" });
        assert(
          await page.$eval("body", (el, name) => el.textContent.includes(name), PRODUCT_NAME),
          "le produit ajouté doit apparaître dans /compte/liste-envies"
        );

        page.on("dialog", (d) => d.accept());
        await page.click('button:has-text("Retirer")');
        await page.waitForTimeout(500);
        assert(
          await page.$eval("body", (el) => el.textContent.includes("Aucun produit enregistré")),
          "la liste doit être vide après retrait"
        );
      },
    },

    {
      name: "sélectionner deux produits à comparer génère un lien vers un tableau de comparaison",
      fn: async ({ page, baseUrl }) => {
        await page.goto(`${baseUrl}/categories/cosmetique-carrosserie`, { waitUntil: "load" });
        await page.waitForTimeout(300);
        const checkboxes = await page.$$(".compare-toggle input");
        assert(checkboxes.length >= 2, "au moins deux cases 'Comparer' doivent être présentes sur une page catégorie");

        await checkboxes[0].check();
        await checkboxes[1].check();
        await page.waitForTimeout(300);

        const compareLink = await page
          .$eval(".cart-link[aria-label='Comparer les produits sélectionnés']", (el) => el.getAttribute("href"))
          .catch(() => null);
        assert(!!compareLink, "un lien vers le comparateur doit apparaître une fois deux produits sélectionnés");

        await page.goto(`${baseUrl}${compareLink}`, { waitUntil: "load" });
        await page.waitForTimeout(300);
        const rows = await page.$$eval(".admin-table tbody tr", (trs) => trs.length);
        assertEqual(rows, 8, "le tableau comparateur doit lister 8 caractéristiques par produit");
      },
    },
  ],
};
