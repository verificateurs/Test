"use strict";

const { assert, assertEqual, gotoSite } = require("./helpers");

/** Sélectionne la catégorie dont le libellé contient le texte donné. */
async function selectCategoryByLabel(page, label) {
  const tabs = await page.$$("#categoryTabs .tab-btn");
  for (const tab of tabs) {
    if ((await tab.textContent()).includes(label)) {
      await tab.click();
      await page.waitForTimeout(250);
      return true;
    }
  }
  throw new Error(`Catégorie « ${label} » introuvable`);
}

/** Ajoute un véhicule au garage via les listes déroulantes en cascade. */
async function addVehicle(page, { makeId, modelId, motorId }) {
  await page.selectOption("#vehMakeSelect", makeId);
  await page.waitForTimeout(120);
  await page.selectOption("#vehModelSelect", modelId);
  await page.waitForTimeout(120);
  await page.selectOption("#vehMotorSelect", motorId);
  await page.waitForTimeout(120);
  await page.click("#addVehicleBtn");
  await page.waitForTimeout(250);
}

module.exports = {
  name: "Garage véhicule et compatibilité produit",
  tests: [
    {
      name: "sans véhicule sélectionné, la compatibilité reste « à vérifier » et n'empêche rien",
      fn: async ({ page, baseUrl }) => {
        await gotoSite(page, baseUrl);
        await selectCategoryByLabel(page, "Kits carrosserie");

        const badge = await page.$eval(".compat-badge", (el) => el.textContent);
        assertEqual(badge, "Compatibilité à vérifier", "le badge neutre est attendu sans véhicule");

        // Le §5.2 du cahier des charges impose que la navigation reste possible.
        assert(await page.$(".btn-add-cart"), "l'achat doit rester possible sans véhicule sélectionné");
      },
    },

    {
      name: "la sélection en cascade renseigne le code moteur",
      fn: async ({ page, baseUrl }) => {
        await gotoSite(page, baseUrl);
        await page.click("#garageToggle");
        await page.waitForTimeout(250);

        await page.selectOption("#vehMakeSelect", "volkswagen");
        await page.waitForTimeout(120);
        await page.selectOption("#vehModelSelect", "golf-7");
        await page.waitForTimeout(120);
        await page.selectOption("#vehMotorSelect", "golf-7-2.0-tdi");
        await page.waitForTimeout(150);

        const code = await page.$eval("#vehCodeMoteur", (el) => el.textContent);
        assert(code.includes("DFHA"), `le code moteur DFHA est attendu, obtenu « ${code} »`);
      },
    },

    {
      name: "le badge passe à compatible puis non compatible selon le véhicule actif",
      fn: async ({ page, baseUrl }) => {
        await gotoSite(page, baseUrl);
        await selectCategoryByLabel(page, "Kits carrosserie");

        await page.click("#garageToggle");
        await page.waitForTimeout(250);
        await addVehicle(page, { makeId: "volkswagen", modelId: "golf-7", motorId: "golf-7-2.0-tdi" });

        assertEqual(
          await page.$eval(".compat-badge", (el) => el.textContent),
          "Compatible avec votre véhicule",
          "la Golf 7 (DFHA) doit être compatible avec les kits Maxton"
        );

        await addVehicle(page, { makeId: "bmw", modelId: "serie-3-g20", motorId: "320d-g20" });
        assertEqual(
          await page.$eval(".compat-badge", (el) => el.textContent),
          "Non compatible",
          "la BMW 320d ne doit pas être compatible avec les kits Maxton"
        );
      },
    },

    {
      name: "le garage survit au rechargement",
      fn: async ({ page, baseUrl }) => {
        await gotoSite(page, baseUrl);
        await page.click("#garageToggle");
        await page.waitForTimeout(250);
        await addVehicle(page, { makeId: "peugeot", modelId: "308-iii", motorId: "308-1.5-bluehdi" });

        await gotoSite(page, baseUrl);
        await page.click("#garageToggle");
        await page.waitForTimeout(250);
        assertEqual(await page.$$eval(".garage-chip", (els) => els.length), 1, "le véhicule doit être conservé");
      },
    },

    {
      name: "la recherche trouve marques et produits et ouvre la fiche",
      fn: async ({ page, baseUrl }) => {
        await gotoSite(page, baseUrl);

        await page.fill("#searchInput", "shampoing");
        await page.waitForTimeout(400);
        const results = await page.$$eval(".search-result-item", (els) => els.length);
        assert(results > 0, "la recherche doit remonter des résultats");

        await page.click(".search-result-item");
        await page.waitForTimeout(350);
        assertEqual(await page.$eval("#productModal", (el) => el.hidden), false, "le résultat doit ouvrir la fiche produit");
      },
    },

    {
      name: "une recherche sans correspondance affiche un message explicite",
      fn: async ({ page, baseUrl }) => {
        await gotoSite(page, baseUrl);
        await page.fill("#searchInput", "zzzzintrouvable");
        await page.waitForTimeout(400);

        const message = await page.$eval(".search-no-results", (el) => el.textContent);
        assert(message.length > 0, "un message d'absence de résultat est attendu");
      },
    },
  ],
};
