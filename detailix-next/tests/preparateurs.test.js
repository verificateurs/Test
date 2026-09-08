"use strict";

const { assert } = require("./helpers");

module.exports = {
  name: "Préparateurs partenaires",
  tests: [
    {
      name: "la liste des réseaux et centres s'affiche, la fiche d'un centre liste ses avis",
      fn: async ({ page, baseUrl }) => {
        await page.goto(`${baseUrl}/preparateurs`, { waitUntil: "load" });
        const body = await page.$eval("body", (el) => el.textContent);
        assert(body.includes("Shiftech"), "le réseau Shiftech doit être listé");
        assert(body.includes("BR Performance"), "le réseau BR Performance doit être listé");

        const tiles = await page.$$(".tile");
        assert(tiles.length > 0, "des centres doivent être listés sous forme de tuiles");

        await tiles[0].click();
        await page.waitForURL("**/preparateurs/**", { timeout: 5000 });
        const heading = await page.$eval("h1", (el) => el.textContent);
        assert(heading.length > 0, "la fiche centre doit avoir un titre");

        const reviews = await page.$$(".review");
        assert(reviews.length > 0, "la fiche centre doit lister au moins un avis");
      },
    },
  ],
};
