"use strict";

const { assert, ADMIN_EMAIL, ADMIN_PASSWORD } = require("./helpers");

const PRODUCT_ID = "303-nettoyant-textile";

async function placeOrder(page, baseUrl, email) {
  await page.goto(`${baseUrl}/produits/${PRODUCT_ID}`, { waitUntil: "load" });
  await page.click('button:has-text("Ajouter au panier")');
  await page.waitForTimeout(300);
  await page.goto(`${baseUrl}/commande`, { waitUntil: "load" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="shippingName"]', "Refund Test");
  await page.fill('input[name="shippingAddr"]', "1 rue du Remboursement");
  await page.fill('input[name="shippingZip"]', "75001");
  await page.fill('input[name="shippingCity"]', "Paris");
  await page.click('button:has-text("Valider la commande")');
  await page.waitForURL("**/commande/confirmation/**", { timeout: 10000 });
  return page.url().split("/").pop();
}

async function loginAsAdmin(page, baseUrl) {
  await page.goto(`${baseUrl}/connexion`, { waitUntil: "load" });
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/compte", { timeout: 8000 });
}

async function openAdminOrder(page, baseUrl, reference) {
  await page.goto(`${baseUrl}/admin/commandes?q=${encodeURIComponent(reference)}`, { waitUntil: "load" });
  await page.click(`tr:has-text("${reference}") a:has-text("Voir")`);
  await page.waitForURL("**/admin/commandes/**", { timeout: 5000 });
}

module.exports = {
  name: "Remboursement admin (Stripe)",
  tests: [
    {
      name: "en mode démonstration (sans clé Stripe), la tentative de remboursement échoue avec un message explicite",
      fn: async ({ page, baseUrl }) => {
        const email = `refund-demo-${Date.now()}@example.com`;
        // En mode démonstration (pas de clé Stripe), le paiement au tunnel de
        // commande marque déjà la commande PAID directement (voir commande/actions.ts).
        const reference = await placeOrder(page, baseUrl, email);

        await loginAsAdmin(page, baseUrl);
        await openAdminOrder(page, baseUrl, reference);

        await page.click('button:has-text("Rembourser via Stripe")');
        await page.waitForTimeout(500);
        const errorText = await page.$eval(".form-error", (el) => el.textContent).catch(() => null);
        assert(
          !!errorText && errorText.toLowerCase().includes("stripe non configuré"),
          `le remboursement doit échouer explicitement en mode démonstration, obtenu « ${errorText} »`
        );

        // L'échec ne doit jamais être silencieusement pris pour un succès : le
        // statut réel (valeur sélectionnée du menu, pas le simple texte "Payée"
        // qui apparaît de toute façon comme option non sélectionnée) doit rester PAID.
        const statusValue = await page.$eval('select[name="status"]', (el) => el.value);
        assert(statusValue === "PAID", `le statut doit rester PAID après un échec de remboursement, obtenu « ${statusValue} »`);
      },
    },

    {
      name: "un CUSTOMER qui rejoue la requête Server Action de remboursement capturée se voit refuser la mutation",
      fn: async ({ page, browser, baseUrl }) => {
        const email = `refund-replay-${Date.now()}@example.com`;
        const reference = await placeOrder(page, baseUrl, email);

        await loginAsAdmin(page, baseUrl);
        await openAdminOrder(page, baseUrl, reference);

        let captured = null;
        page.on("request", (req) => {
          if (!captured && req.method() === "POST" && req.headers()["next-action"]) {
            captured = { url: req.url(), headers: req.headers(), postData: req.postData() };
          }
        });
        await page.click('button:has-text("Rembourser via Stripe")');
        await page.waitForTimeout(500);
        assert(!!captured, "la requête Server Action de remboursement doit avoir été capturée");

        const customerContext = await browser.newContext();
        const customerPage = await customerContext.newPage();
        const custEmail = `customer-refund-replay-${Date.now()}@example.com`;
        await customerPage.goto(`${baseUrl}/inscription`, { waitUntil: "load" });
        await customerPage.fill('input[name="displayName"]', "Customer Refund Replay");
        await customerPage.fill('input[name="email"]', custEmail);
        await customerPage.fill('input[name="password"]', "motdepasse-solide-123");
        await customerPage.click('button[type="submit"]');
        await customerPage.waitForURL("**/compte", { timeout: 8000 });

        // requireAdmin() doit rejeter cette requête avant tout appel Stripe —
        // rejouée par un compte CUSTOMER, elle ne doit jamais aboutir.
        await customerPage.request.post(captured.url, {
          headers: { ...captured.headers, cookie: undefined },
          data: captured.postData,
        });
        await customerContext.close();

        await page.reload({ waitUntil: "load" });
        const statusValue = await page.$eval('select[name="status"]', (el) => el.value);
        assert(statusValue === "PAID", `le statut ne doit pas changer suite au rejeu par un CUSTOMER, obtenu « ${statusValue} »`);
      },
    },
  ],
};
