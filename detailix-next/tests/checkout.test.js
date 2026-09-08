"use strict";

const { assert, assertEqual } = require("./helpers");

const PRODUCT_1 = "303-aerospace-protectant";
const PRODUCT_2 = "303-nettoyant-textile";

module.exports = {
  name: "Panier et tunnel de commande",
  tests: [
    {
      name: "ajout panier (fusion de quantité), code promo, confirmation, panier vidé",
      fn: async ({ page, baseUrl }) => {
        await page.goto(`${baseUrl}/produits/${PRODUCT_1}`, { waitUntil: "load" });
        await page.click('button:has-text("Ajouter au panier")');
        await page.waitForTimeout(300);
        assertEqual(await page.$eval(".cart-count", (el) => el.textContent), "1", "badge panier après premier ajout");

        // Même produit ajouté une seconde fois -> fusionné en une ligne de qté 2, pas 2 lignes.
        await page.click('button:has-text("Ajouter au panier")');
        await page.waitForTimeout(300);
        assertEqual(await page.$eval(".cart-count", (el) => el.textContent), "2", "badge panier après second ajout du même produit");

        await page.goto(`${baseUrl}/produits/${PRODUCT_2}`, { waitUntil: "load" });
        await page.click('button:has-text("Ajouter au panier")');
        await page.waitForTimeout(300);
        assertEqual(await page.$eval(".cart-count", (el) => el.textContent), "3", "badge panier après ajout d'un second produit");

        await page.goto(`${baseUrl}/panier`, { waitUntil: "load" });
        await page.waitForTimeout(300);
        const rows = await page.$$eval(".cart-table tbody tr", (trs) => trs.length);
        assertEqual(rows, 2, "deux lignes de panier attendues (produits distincts fusionnés par ligne)");

        await page.click('a:has-text("Passer la commande")');
        await page.waitForURL("**/commande", { timeout: 8000 });
        await page.waitForTimeout(300);

        await page.fill('input[name="email"]', "checkout-test@example.com");
        await page.fill('input[name="shippingName"]', "Jean Testeur");
        await page.fill('input[name="shippingAddr"]', "12 rue de la Détonation");
        await page.fill('input[name="shippingZip"]', "75001");
        await page.fill('input[name="shippingCity"]', "Paris");
        await page.fill('input[name="promoCode"]', "BIENVENUE10");

        await page.click('button:has-text("Valider la commande")');
        await page.waitForURL("**/commande/confirmation/**", { timeout: 10000 });

        const discountEl = await page.$(".order-summary-subtotal:has-text('Remise')");
        assert(!!discountEl, "la remise du code promo BIENVENUE10 doit apparaître sur la confirmation");

        // Le panier doit être vidé après une commande passée.
        await page.goto(`${baseUrl}/panier`, { waitUntil: "load" });
        await page.waitForTimeout(500);
        const emptyMsg = await page.$eval(".section-intro", (el) => el.textContent).catch(() => null);
        assert(!!emptyMsg && emptyMsg.includes("vide"), `le panier doit être vide après commande, obtenu « ${emptyMsg} »`);
      },
    },

    {
      name: "un prix trafiqué côté client dans localStorage n'affecte pas le total réellement facturé",
      fn: async ({ page, baseUrl }) => {
        await page.goto(`${baseUrl}/produits/${PRODUCT_1}`, { waitUntil: "load" });
        await page.click('button:has-text("Ajouter au panier")');
        await page.waitForTimeout(300);

        // Falsification directe du localStorage : prix ramené à 0,01€.
        await page.evaluate(() => {
          const cart = JSON.parse(localStorage.getItem("detailix:cart:v1"));
          cart[0].unitPriceSnapshot = 0.01;
          cart[0].qty = 1;
          localStorage.setItem("detailix:cart:v1", JSON.stringify(cart));
        });

        await page.goto(`${baseUrl}/commande`, { waitUntil: "load" });
        await page.fill('input[name="email"]', "tamper-test@example.com");
        await page.fill('input[name="shippingName"]', "Tamper Test");
        await page.fill('input[name="shippingAddr"]', "1 rue Falsifiée");
        await page.fill('input[name="shippingZip"]', "75001");
        await page.fill('input[name="shippingCity"]', "Paris");
        await page.click('button:has-text("Valider la commande")');
        await page.waitForURL("**/commande/confirmation/**", { timeout: 10000 });

        const totalText = await page.$eval(".order-summary-total", (el) => el.textContent);
        assert(
          !totalText.includes("0,01"),
          `le total facturé doit être recalculé serveur depuis le prix réel du produit, jamais depuis le prix trafiqué (obtenu « ${totalText} »)`
        );
      },
    },
  ],
};
