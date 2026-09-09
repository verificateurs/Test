"use strict";

const { assert, assertEqual, ADMIN_EMAIL, ADMIN_PASSWORD } = require("./helpers");

// Produit dédié à ce test (pas 303-aerospace-protectant, partagé par
// checkout/pro-discount/order-history) : on modifie son stock, ne pas
// interférer avec le budget de stock d'une autre suite.
const PRODUCT_ID = "philips-led-h4";
const PRODUCT_NAME = "Kit ampoules LED H4";

async function loginAsAdmin(page, baseUrl) {
  await page.goto(`${baseUrl}/connexion`, { waitUntil: "load" });
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/compte", { timeout: 8000 });
}

async function setStockQty(page, baseUrl, qty) {
  await page.goto(`${baseUrl}/admin/produits/${PRODUCT_ID}`, { waitUntil: "load" });
  await page.fill('input[name="stockQty"]', String(qty));
  await page.click('button:has-text("Mettre à jour")');
  await page.waitForURL("**/admin/produits", { timeout: 8000 });
}

module.exports = {
  name: "Stock — décrément atomique à la commande",
  tests: [
    {
      name: "une commande décrémente le stock ; une quantité supérieure au stock disponible est refusée au paiement",
      fn: async ({ page, baseUrl }) => {
        await loginAsAdmin(page, baseUrl);
        await setStockQty(page, baseUrl, 1);

        // Tentative d'achat de 2 unités alors qu'il n'y en a qu'une : le panier
        // client autorise d'empiler les clics (pas de plafond côté panier), le
        // rejet doit venir du serveur au moment de payer.
        await page.goto(`${baseUrl}/produits/${PRODUCT_ID}`, { waitUntil: "load" });
        await page.click('button:has-text("Ajouter au panier")');
        await page.waitForTimeout(300);
        await page.click('button:has-text("Ajouter au panier")');
        await page.waitForTimeout(300);

        await page.goto(`${baseUrl}/commande`, { waitUntil: "load" });
        await page.fill('input[name="email"]', "stock-insuffisant@example.com");
        await page.fill('input[name="shippingName"]', "Stock Test");
        await page.fill('input[name="shippingAddr"]', "1 rue du Stock");
        await page.fill('input[name="shippingZip"]', "75001");
        await page.fill('input[name="shippingCity"]', "Paris");
        await page.click('button:has-text("Valider la commande")');
        await page.waitForTimeout(500);
        assert(page.url().includes("/commande") && !page.url().includes("/confirmation"), "la commande ne doit pas aboutir faute de stock suffisant");
        const errorText = await page.$eval(".form-error", (el) => el.textContent).catch(() => null);
        assert(!!errorText && errorText.toLowerCase().includes("stock"), `un message d'erreur de stock doit s'afficher, obtenu « ${errorText} »`);

        // Le stock n'a pas bougé : la transaction avortée n'a rien décrémenté.
        await page.goto(`${baseUrl}/admin/produits`, { waitUntil: "load" });
        const qtyAfterFailure = await page.locator(`tr:has-text("${PRODUCT_NAME}") td:nth-child(6)`).textContent();
        assertEqual(qtyAfterFailure.trim(), "1", "un paiement refusé ne doit pas avoir touché le stock");

        // On ramène la quantité du panier à ce qui est réellement disponible.
        await page.goto(`${baseUrl}/panier`, { waitUntil: "load" });
        await page.fill(`input[aria-label="Quantité pour ${PRODUCT_NAME}"]`, "1");
        await page.waitForTimeout(300);

        await page.goto(`${baseUrl}/commande`, { waitUntil: "load" });
        await page.fill('input[name="email"]', "stock-ok@example.com");
        await page.fill('input[name="shippingName"]', "Stock Test");
        await page.fill('input[name="shippingAddr"]', "1 rue du Stock");
        await page.fill('input[name="shippingZip"]', "75001");
        await page.fill('input[name="shippingCity"]', "Paris");
        await page.click('button:has-text("Valider la commande")');
        await page.waitForURL("**/commande/confirmation/**", { timeout: 10000 });

        // Stock retombé à 0 (visible côté admin, source dynamique — la fiche
        // produit publique est force-static et ne se revalide pas à chaque
        // commande, volontairement : seule l'application du décompte au
        // paiement est garantie, pas l'actualisation immédiate du badge
        // affiché sur la fiche statique).
        await page.goto(`${baseUrl}/admin/produits`, { waitUntil: "load" });
        const qtyAfterSuccess = await page.locator(`tr:has-text("${PRODUCT_NAME}") td:nth-child(6)`).textContent();
        assertEqual(qtyAfterSuccess.trim(), "0", "la commande réussie doit avoir décrémenté le stock jusqu'à 0");

        // Une commande suivante est désormais refusée par le serveur (rupture
        // totale), même si le panier autorise à ajouter le produit à nouveau —
        // la vérification fait foi côté serveur, pas via le badge affiché.
        await page.goto(`${baseUrl}/produits/${PRODUCT_ID}`, { waitUntil: "load" });
        await page.click('button:has-text("Ajouter au panier")');
        await page.waitForTimeout(300);

        await page.goto(`${baseUrl}/commande`, { waitUntil: "load" });
        await page.fill('input[name="email"]', "stock-epuise@example.com");
        await page.fill('input[name="shippingName"]', "Stock Test");
        await page.fill('input[name="shippingAddr"]', "1 rue du Stock");
        await page.fill('input[name="shippingZip"]', "75001");
        await page.fill('input[name="shippingCity"]', "Paris");
        await page.click('button:has-text("Valider la commande")');
        await page.waitForTimeout(500);
        const secondErrorText = await page.$eval(".form-error", (el) => el.textContent).catch(() => null);
        assert(
          !!secondErrorText && secondErrorText.toLowerCase().includes("stock"),
          `un stock épuisé (0) doit aussi être refusé au paiement, obtenu « ${secondErrorText} »`
        );
      },
    },
  ],
};
