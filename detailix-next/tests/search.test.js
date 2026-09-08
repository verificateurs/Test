"use strict";

const { assert } = require("./helpers");

module.exports = {
  name: "Recherche interne",
  tests: [
    {
      name: "taper un nom de produit affiche un résultat cliquable qui mène à sa fiche",
      fn: async ({ page, baseUrl }) => {
        await page.goto(`${baseUrl}/`, { waitUntil: "load" });
        await page.fill(".search-input", "Aerospace");
        await page.waitForSelector(".search-result-item", { timeout: 5000 });

        const resultText = await page.$eval(".search-result-item .search-result-name", (el) => el.textContent);
        assert(resultText.includes("Aerospace"), `le résultat doit correspondre à la recherche, obtenu « ${resultText} »`);

        await page.click(".search-result-item");
        await page.waitForURL("**/produits/**", { timeout: 5000 });
        const heading = await page.$eval("h1", (el) => el.textContent);
        assert(heading.includes("Aerospace"), `la sélection doit mener à la fiche produit, titre obtenu « ${heading} »`);
      },
    },

    {
      name: "une recherche sans résultat affiche un message explicite plutôt qu'une liste vide silencieuse",
      fn: async ({ page, baseUrl }) => {
        await page.goto(`${baseUrl}/`, { waitUntil: "load" });
        await page.fill(".search-input", "zzzznoresultzzzz");
        // .search-no-results affiche aussi bien "Recherche…" (chargement de l'index)
        // que "Aucun résultat." : on attend spécifiquement le second état.
        await page.waitForSelector(".search-no-results:has-text('Aucun résultat')", { timeout: 5000 });
      },
    },
  ],
};
