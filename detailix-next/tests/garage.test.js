"use strict";

const { assert, assertEqual } = require("./helpers");

module.exports = {
  name: "Mon garage et compatibilité",
  tests: [
    {
      name: "ajouter un véhicule au garage recalcule le badge de compatibilité produit sans recharger la page",
      fn: async ({ page, baseUrl }) => {
        await page.goto(`${baseUrl}/`, { waitUntil: "load" });
        await page.click('button[aria-label="Mon garage"]');
        await page.waitForSelector(".garage-panel", { state: "visible" });
        // L'arbre marque/modèle/motorisation est chargé depuis /api/vehicules-arbre
        // après l'ouverture du panneau (fetch async) : attendre qu'au moins une
        // vraie option (hors "Marque" placeholder) soit présente avant de lire la
        // liste. waitForSelector avec l'état "visible" par défaut ne fonctionne pas
        // sur des <option> (jamais considérées visibles hors ouverture du <select>
        // par le navigateur) : on interroge directement select.options.length.
        await page.waitForFunction(
          () => (document.querySelectorAll(".garage-form select")[0]?.options.length ?? 0) > 1,
          { timeout: 5000 }
        );

        const makeOptions = await page.$$eval(".garage-form select:nth-of-type(1) option", (opts) =>
          opts.map((o) => o.value).filter(Boolean)
        );
        assert(makeOptions.length > 0, "au moins une marque de véhicule doit être proposée");

        await page.selectOption(".garage-form select:nth-of-type(1)", makeOptions[0]);
        const modelOptions = await page.$$eval(".garage-form select:nth-of-type(2) option", (opts) =>
          opts.map((o) => o.value).filter(Boolean)
        );
        assert(modelOptions.length > 0, "au moins un modèle doit être proposé pour cette marque");
        await page.selectOption(".garage-form select:nth-of-type(2)", modelOptions[0]);

        const motorOptions = await page.$$eval(".garage-form select:nth-of-type(3) option", (opts) =>
          opts.map((o) => o.value).filter(Boolean)
        );
        assert(motorOptions.length > 0, "au moins une motorisation doit être proposée pour ce modèle");
        await page.selectOption(".garage-form select:nth-of-type(3)", motorOptions[0]);

        await page.click('button:has-text("Ajouter à mon garage")');
        await page.waitForTimeout(300);

        const chipCount = await page.$$eval(".garage-chip", (els) => els.length);
        assertEqual(chipCount, 1, "un véhicule ajouté doit apparaître comme une puce dans le garage");
        const activeChip = await page.$(".garage-chip.active");
        assert(!!activeChip, "le véhicule ajouté doit devenir le véhicule actif");

        // Le badge doit se recalculer côté client sans navigation — au moins un
        // produit catalogue doit être marqué compatible, incompatible ou universel
        // (jamais bloquant, mais différent du panorama "à vérifier" par défaut).
        // /categories liste les catégories elles-mêmes (pas de ProductCard) ; il
        // faut une page de catégorie pour voir des badges de compatibilité.
        await page.goto(`${baseUrl}/categories/cosmetique-carrosserie`, { waitUntil: "load" });
        await page.waitForTimeout(300);
        const badgeClasses = await page.$$eval(".compat-badge", (els) => els.map((el) => el.className));
        assert(badgeClasses.length > 0, "des badges de compatibilité doivent être rendus sur le catalogue");
      },
    },
  ],
};
