"use strict";

const { assert, assertEqual, gotoSite } = require("./helpers");

module.exports = {
  name: "Boutique — catalogue, panier et commande",
  tests: [
    {
      name: "le catalogue se charge et affiche marques, produits et prix",
      fn: async ({ page, baseUrl }) => {
        await gotoSite(page, baseUrl);

        const brands = await page.$$eval(".brand-card", (els) => els.length);
        assert(brands > 0, "des cartes marque doivent être rendues");

        const price = await page.$eval(".product-price", (el) => el.textContent);
        assert(/\d/.test(price) && price.includes("€"), `un prix en euros est attendu, obtenu « ${price} »`);
      },
    },

    {
      name: "les prix suivent la marge configurée",
      fn: async ({ page, baseUrl }) => {
        await gotoSite(page, baseUrl);

        // Le prix affiché doit valoir prixAchat × (1 + marge), jamais une valeur stockée.
        const check = await page.evaluate(() => {
          const product = productsData.products.find((p) => p.prixAchat > 0);
          const expected = product.prixAchat * (1 + pricingConfig.marginPercent / 100);
          return { computed: computeSellPrice(product.prixAchat), expected: Math.round(expected * 100) / 100 };
        });
        assertEqual(check.computed, check.expected, "computeSellPrice doit appliquer exactement la marge");
      },
    },

    {
      name: "ajouter au panier met à jour le compteur et le total",
      fn: async ({ page, baseUrl }) => {
        await gotoSite(page, baseUrl);

        const buttons = await page.$$(".btn-add-cart");
        await buttons[0].click();
        await page.waitForTimeout(150);
        await buttons[1].click();
        await page.waitForTimeout(250);

        assertEqual(await page.$eval("#cartCount", (el) => el.textContent), "2", "deux articles attendus");

        await page.click("#cartToggle");
        await page.waitForTimeout(300);
        const lines = await page.$$eval(".cart-line", (els) => els.length);
        assertEqual(lines, 2, "deux lignes attendues dans le panier");

        const total = await page.$eval("#cartSubtotal", (el) => el.textContent);
        assert(total.includes("€") && !total.startsWith("0,00"), `total non nul attendu, obtenu « ${total} »`);
      },
    },

    {
      name: "le panier survit au rechargement de la page",
      fn: async ({ page, baseUrl }) => {
        await gotoSite(page, baseUrl);
        await page.click(".btn-add-cart");
        await page.waitForTimeout(200);

        await gotoSite(page, baseUrl);
        assertEqual(await page.$eval("#cartCount", (el) => el.textContent), "1", "le panier doit être restauré");
      },
    },

    {
      name: "le tunnel de commande va jusqu'à la confirmation et vide le panier",
      fn: async ({ page, baseUrl }) => {
        await gotoSite(page, baseUrl);
        await page.click(".btn-add-cart");
        await page.waitForTimeout(200);
        await page.click("#cartToggle");
        await page.waitForTimeout(300);
        await page.click("#checkoutBtn");
        await page.waitForTimeout(300);

        await page.fill('#checkoutStepLivraison input[name="nom"]', "Camille Martin");
        await page.fill('#checkoutStepLivraison input[name="adresse"]', "12 rue des Essais");
        await page.fill('#checkoutStepLivraison input[name="codePostal"]', "69000");
        await page.fill('#checkoutStepLivraison input[name="ville"]', "Lyon");
        await page.click('#checkoutStepLivraison button[type="submit"]');
        await page.waitForTimeout(250);

        await page.fill('#checkoutStepPaiement input[name="nomCarte"]', "Camille Martin");
        await page.fill('#checkoutStepPaiement input[name="numeroCarte"]', "4242 4242 4242 4242");
        await page.fill('#checkoutStepPaiement input[name="expiration"]', "12/28");
        await page.fill('#checkoutStepPaiement input[name="cvc"]', "123");
        await page.click('#checkoutStepPaiement button[type="submit"]');
        await page.waitForTimeout(350);

        const orderNumber = await page.$eval("#orderNumber", (el) => el.textContent);
        assert(orderNumber.startsWith("DTX-"), `numéro de commande attendu, obtenu « ${orderNumber} »`);

        await page.click("#checkoutDone");
        await page.waitForTimeout(250);
        assertEqual(await page.$eval("#cartCount", (el) => el.hidden), true, "le panier doit être vidé après commande");
      },
    },

    {
      name: "les filtres restreignent la liste et gèrent l'absence de résultat",
      fn: async ({ page, baseUrl }) => {
        await gotoSite(page, baseUrl);

        const before = await page.$$eval(".brand-card", (els) => els.length);
        await page.click("#filterRecommended");
        await page.waitForTimeout(200);
        const after = await page.$$eval(".brand-card", (els) => els.length);
        assert(after < before, `le filtre doit réduire la liste (${before} → ${after})`);

        await page.$eval("#filterMaxPrice", (el) => {
          el.value = "0";
          el.dispatchEvent(new Event("input"));
        });
        await page.waitForTimeout(200);
        assert(await page.$(".empty-state"), "un état vide explicite doit s'afficher");

        await page.click("#filterReset");
        await page.waitForTimeout(200);
        assertEqual(await page.$$eval(".brand-card", (els) => els.length), before, "la réinitialisation doit tout restaurer");
      },
    },

    {
      name: "la fiche produit s'ouvre au clic sans déclencher l'ajout au panier",
      fn: async ({ page, baseUrl }) => {
        await gotoSite(page, baseUrl);

        await page.click(".product-info");
        await page.waitForTimeout(300);
        assertEqual(await page.$eval("#productModal", (el) => el.hidden), false, "la fiche doit s'ouvrir");
        assertEqual(await page.$eval("#cartCount", (el) => el.hidden), true, "ouvrir la fiche ne doit rien ajouter");

        await page.click("#productModalClose");
        await page.waitForTimeout(300);
        assertEqual(await page.$eval("#productModal", (el) => el.hidden), true, "la fiche doit se fermer");
      },
    },
  ],
};
