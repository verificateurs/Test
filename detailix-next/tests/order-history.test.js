"use strict";

const { assert, assertEqual } = require("./helpers");

const PRODUCT_ID = "303-aerospace-protectant";

function referenceFromUrl(url) {
  return url.split("/").pop();
}

module.exports = {
  name: "Historique des commandes (/compte/commandes)",
  tests: [
    {
      name: "une commande passée apparaît dans l'historique du client, un autre client ne peut pas y accéder (IDOR)",
      fn: async ({ page, browser, baseUrl }) => {
        const emailA = `hist-a-${Date.now()}@example.com`;
        const emailB = `hist-b-${Date.now()}@example.com`;

        await page.goto(`${baseUrl}/inscription`, { waitUntil: "load" });
        await page.fill('input[name="displayName"]', "Hist A");
        await page.fill('input[name="email"]', emailA);
        await page.fill('input[name="password"]', "motdepasse-solide-123");
        await page.click('button[type="submit"]');
        await page.waitForURL("**/compte", { timeout: 8000 });

        await page.goto(`${baseUrl}/produits/${PRODUCT_ID}`, { waitUntil: "load" });
        await page.click('button:has-text("Ajouter au panier")');
        await page.waitForTimeout(300);

        await page.goto(`${baseUrl}/commande`, { waitUntil: "load" });
        await page.fill('input[name="email"]', emailA);
        await page.fill('input[name="shippingName"]', "Hist A");
        await page.fill('input[name="shippingAddr"]', "1 rue Test");
        await page.fill('input[name="shippingZip"]', "75001");
        await page.fill('input[name="shippingCity"]', "Paris");
        await page.click('button:has-text("Valider la commande")');
        await page.waitForURL("**/commande/confirmation/**", { timeout: 10000 });
        const reference = referenceFromUrl(page.url());

        await page.goto(`${baseUrl}/compte/commandes`, { waitUntil: "load" });
        assert(
          await page.$eval("body", (el, ref) => el.textContent.includes(ref), reference),
          "la référence de la commande passée doit apparaître dans /compte/commandes"
        );

        await page.click('a:has-text("Voir le détail")');
        await page.waitForURL(`**/compte/commandes/${reference}`, { timeout: 5000 });
        const heading = await page.$eval("h1", (el) => el.textContent);
        assert(heading.includes(reference), `le détail doit afficher la référence, obtenu « ${heading} »`);

        // Un second client ne doit jamais pouvoir consulter la commande du premier
        // en devinant/rejouant sa référence — la page filtre par userId de session,
        // jamais par le seul identifiant d'URL.
        const contextB = await browser.newContext();
        const pageB = await contextB.newPage();
        await pageB.goto(`${baseUrl}/inscription`, { waitUntil: "load" });
        await pageB.fill('input[name="displayName"]', "Hist B");
        await pageB.fill('input[name="email"]', emailB);
        await pageB.fill('input[name="password"]', "motdepasse-solide-456");
        await pageB.click('button[type="submit"]');
        await pageB.waitForURL("**/compte", { timeout: 8000 });

        const resp = await pageB.goto(`${baseUrl}/compte/commandes/${reference}`, { waitUntil: "load" });
        assertEqual(resp.status(), 404, "l'accès croisé à la commande d'un autre client doit renvoyer 404");
        await contextB.close();
      },
    },
  ],
};
