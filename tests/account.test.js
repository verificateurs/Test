"use strict";

const { assert, assertEqual, gotoSite } = require("./helpers");

async function placeOrder(page) {
  await page.click(".btn-add-cart");
  await page.waitForTimeout(200);
  await page.click("#cartToggle");
  await page.waitForTimeout(300);
  await page.click("#checkoutBtn");
  await page.waitForTimeout(300);
  await page.fill('#checkoutStepLivraison input[name="nom"]', "Camille Martin");
  await page.fill('#checkoutStepLivraison input[name="adresse"]', "12 rue des Essais");
  await page.fill('#checkoutStepLivraison input[name="codePostal"]', "75000");
  await page.fill('#checkoutStepLivraison input[name="ville"]', "Paris");
  await page.click('#checkoutStepLivraison button[type="submit"]');
  await page.waitForTimeout(250);
  await page.fill('#checkoutStepPaiement input[name="nomCarte"]', "Camille Martin");
  await page.fill('#checkoutStepPaiement input[name="numeroCarte"]', "4242 4242 4242 4242");
  await page.fill('#checkoutStepPaiement input[name="expiration"]', "12/28");
  await page.fill('#checkoutStepPaiement input[name="cvc"]', "123");
  await page.click('#checkoutStepPaiement button[type="submit"]');
  await page.waitForTimeout(350);
  const orderNumber = await page.$eval("#orderNumber", (el) => el.textContent);
  await page.click("#checkoutDone");
  await page.waitForTimeout(250);
  return orderNumber;
}

module.exports = {
  name: "Compte simulé, historique et effacement des données",
  tests: [
    {
      name: "la connexion simulée affiche le nom et survit au rechargement",
      fn: async ({ page, baseUrl }) => {
        await gotoSite(page, baseUrl);
        await page.click("#accountToggle");
        await page.waitForTimeout(300);
        await page.fill('#loginForm input[name="displayName"]', "Camille Martin");
        await page.click('#loginForm button[type="submit"]');
        await page.waitForTimeout(250);

        assertEqual(await page.$eval("#accountDisplayName", (el) => el.textContent), "Camille Martin", "le nom doit s'afficher");

        await gotoSite(page, baseUrl);
        await page.click("#accountToggle");
        await page.waitForTimeout(300);
        assertEqual(await page.$eval("#accountDisplayName", (el) => el.textContent), "Camille Martin", "la session doit persister");
      },
    },

    {
      name: "une commande passée apparaît dans l'historique après rechargement",
      fn: async ({ page, baseUrl }) => {
        await gotoSite(page, baseUrl);
        const orderNumber = await placeOrder(page);

        await gotoSite(page, baseUrl);
        await page.click("#accountToggle");
        await page.waitForTimeout(300);

        const items = await page.$$eval(".order-history-item", (els) => els.length);
        assertEqual(items, 1, "une commande doit figurer dans l'historique");

        const text = await page.$eval(".order-history-item", (el) => el.textContent);
        assert(text.includes(orderNumber), `l'historique doit contenir ${orderNumber}`);
      },
    },

    {
      name: "la déconnexion efface l'historique (nom et adresse en clair)",
      fn: async ({ page, baseUrl }) => {
        await gotoSite(page, baseUrl);
        await placeOrder(page);

        await page.click("#accountToggle");
        await page.waitForTimeout(300);
        await page.fill('#loginForm input[name="displayName"]', "Camille Martin");
        await page.click('#loginForm button[type="submit"]');
        await page.waitForTimeout(250);

        await page.click("#logoutBtn");
        await page.waitForTimeout(250);

        // Le « compte » ne cloisonne rien : un autre pseudo ne doit pas hériter
        // des commandes du précédent sur le même navigateur.
        const items = await page.$$eval(".order-history-item", (els) => els.length);
        assertEqual(items, 0, "l'historique doit être effacé à la déconnexion");

        const stored = await page.evaluate(() => localStorage.getItem("detailix_orders_v1"));
        assertEqual(stored, "[]", "les commandes doivent aussi disparaître du stockage");
      },
    },

    {
      name: "l'effacement des données locales vide les quatre magasins",
      fn: async ({ page, baseUrl }) => {
        await gotoSite(page, baseUrl);
        await page.click(".btn-add-cart");
        await page.waitForTimeout(200);

        // Le bouton passe par window.confirm : on l'accepte automatiquement.
        page.on("dialog", (dialog) => dialog.accept());
        await page.click("#accountToggle");
        await page.waitForTimeout(300);
        await page.click("#eraseDataBtn");
        await page.waitForTimeout(600);

        const remaining = await page.evaluate(() =>
          ["detailix_cart_v1", "detailix_garage_v1", "detailix_account_v1", "detailix_orders_v1"].filter((k) =>
            localStorage.getItem(k)
          )
        );
        assertEqual(remaining.length, 0, `toutes les clés doivent être supprimées, restantes : ${remaining.join(", ")}`);
      },
    },
  ],
};
