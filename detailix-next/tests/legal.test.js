"use strict";

const { assert } = require("./helpers");

module.exports = {
  name: "Pages légales",
  tests: [
    {
      name: "les mentions légales et la politique de confidentialité sont accessibles depuis le pied de page",
      fn: async ({ page, baseUrl }) => {
        await page.goto(`${baseUrl}/`, { waitUntil: "load" });

        await page.click('a:has-text("Mentions légales")');
        await page.waitForURL("**/mentions-legales", { timeout: 5000 });
        assert((await page.$eval("h1", (el) => el.textContent)) === "Mentions légales", "titre attendu sur /mentions-legales");

        await page.goto(`${baseUrl}/`, { waitUntil: "load" });
        await page.click('a:has-text("Politique de confidentialité")');
        await page.waitForURL("**/confidentialite", { timeout: 5000 });
        assert(
          (await page.$eval("h1", (el) => el.textContent)) === "Politique de confidentialité",
          "titre attendu sur /confidentialite"
        );
      },
    },
  ],
};
