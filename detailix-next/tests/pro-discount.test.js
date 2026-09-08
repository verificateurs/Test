"use strict";

const { assert, ADMIN_EMAIL, ADMIN_PASSWORD } = require("./helpers");

const PRODUCT_1 = "303-aerospace-protectant";
const PRODUCT_2 = "303-nettoyant-textile";

module.exports = {
  name: "Remise espace pro",
  tests: [
    {
      name: "un compte promu PRO par un admin obtient la remise pro au moment de la commande",
      fn: async ({ page, browser, baseUrl }) => {
        const email = `pro-test-${Date.now()}@example.com`;

        const customerContext = await browser.newContext();
        const customerPage = await customerContext.newPage();
        await customerPage.goto(`${baseUrl}/inscription`, { waitUntil: "load" });
        await customerPage.fill('input[name="displayName"]', "Pro Test");
        await customerPage.fill('input[name="email"]', email);
        await customerPage.fill('input[name="password"]', "motdepasse-solide-123");
        await customerPage.click('button[type="submit"]');
        await customerPage.waitForURL("**/compte", { timeout: 8000 });

        // Promotion en PRO via l'interface admin (pas d'accès direct à la base) : un
        // admin réel promeut un compte depuis /admin/utilisateurs.
        await page.goto(`${baseUrl}/connexion`, { waitUntil: "load" });
        await page.fill('input[name="email"]', ADMIN_EMAIL);
        await page.fill('input[name="password"]', ADMIN_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForURL("**/compte", { timeout: 8000 });

        await page.goto(`${baseUrl}/admin/utilisateurs`, { waitUntil: "load" });
        const row = page.locator(`tr:has-text("${email}")`);
        await row.locator('select[name="role"]').selectOption("PRO");
        await row.locator('button:has-text("Mettre à jour")').click();
        await page.waitForTimeout(500);

        const roleCell = await page.locator(`tr:has-text("${email}") td:nth-child(3)`).textContent();
        assert(roleCell.trim() === "Pro", `le compte doit apparaître avec le rôle Pro, obtenu « ${roleCell.trim()} »`);

        // Achat avec le compte désormais PRO : la remise doit s'appliquer sans code promo.
        await customerPage.goto(`${baseUrl}/produits/${PRODUCT_1}`, { waitUntil: "load" });
        await customerPage.click('button:has-text("Ajouter au panier")');
        await customerPage.waitForTimeout(300);
        await customerPage.click('button:has-text("Ajouter au panier")'); // qté 2
        await customerPage.waitForTimeout(300);

        await customerPage.goto(`${baseUrl}/produits/${PRODUCT_2}`, { waitUntil: "load" });
        await customerPage.click('button:has-text("Ajouter au panier")');
        await customerPage.waitForTimeout(300);

        await customerPage.goto(`${baseUrl}/commande`, { waitUntil: "load" });
        await customerPage.fill('input[name="email"]', email);
        await customerPage.fill('input[name="shippingName"]', "Pro Test");
        await customerPage.fill('input[name="shippingAddr"]', "1 rue du Garage");
        await customerPage.fill('input[name="shippingZip"]', "75001");
        await customerPage.fill('input[name="shippingCity"]', "Paris");
        await customerPage.click('button:has-text("Valider la commande")');
        await customerPage.waitForURL("**/commande/confirmation/**", { timeout: 10000 });

        const discountRow = await customerPage
          .$eval(".order-summary-subtotal:has-text('Remise')", (el) => el.textContent)
          .catch(() => null);
        assert(!!discountRow, "une ligne de remise pro doit apparaître sur la confirmation sans code promo saisi");

        await customerContext.close();
      },
    },
  ],
};
