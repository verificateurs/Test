"use strict";

const { assert, assertEqual, ADMIN_EMAIL, ADMIN_PASSWORD } = require("./helpers");

async function loginAsAdmin(page, baseUrl) {
  await page.goto(`${baseUrl}/connexion`, { waitUntil: "load" });
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/compte", { timeout: 8000 });
}

module.exports = {
  name: "Panel admin — CRUD et cloisonnement RBAC",
  tests: [
    {
      name: "création catégorie -> marque -> produit, visible immédiatement sur la fiche publique, puis suppression",
      fn: async ({ page, baseUrl }) => {
        await loginAsAdmin(page, baseUrl);

        await page.goto(`${baseUrl}/admin/categories/nouveau`, { waitUntil: "load" });
        await page.fill('input[name="label"]', "Catégorie Test E2E");
        await page.fill('textarea[name="description"]', "Catégorie créée par le test automatisé.");
        await page.fill('input[name="position"]', "99");
        await page.click('button:has-text("Créer la catégorie")');
        await page.waitForURL("**/admin/categories", { timeout: 8000 });
        assert(
          await page.$eval("body", (el) => el.textContent.includes("Catégorie Test E2E")),
          "la catégorie créée doit apparaître dans la liste admin"
        );

        await page.goto(`${baseUrl}/admin/marques/nouveau`, { waitUntil: "load" });
        await page.fill('input[name="name"]', "Marque Test E2E");
        await page.fill('input[name="origine"]', "France");
        await page.fill('input[name="gamme"]', "Standard");
        await page.selectOption('select[name="categoryId"]', { label: "Catégorie Test E2E" });
        await page.fill('textarea[name="preference"]', "Marque de test.");
        await page.click('button:has-text("Créer la marque")');
        await page.waitForURL("**/admin/marques", { timeout: 8000 });
        assert(
          await page.$eval("body", (el) => el.textContent.includes("Marque Test E2E")),
          "la marque créée doit apparaître dans la liste admin"
        );

        await page.goto(`${baseUrl}/admin/produits/nouveau`, { waitUntil: "load" });
        await page.fill('input[name="name"]', "Produit Test E2E");
        await page.fill('input[name="format"]', "1 unité");
        await page.fill('textarea[name="description"]', "Produit créé par le test automatisé.");
        await page.fill('input[name="prixAchat"]', "10");
        await page.selectOption('select[name="brandId"]', { label: "Marque Test E2E" });
        await page.selectOption('select[name="categoryId"]', { label: "Catégorie Test E2E" });
        await page.click('button:has-text("Créer le produit")');
        await page.waitForURL("**/admin/produits", { timeout: 8000 });
        assert(
          await page.$eval("body", (el) => el.textContent.includes("Produit Test E2E")),
          "le produit créé doit apparaître dans la liste admin"
        );

        // La fiche produit publique statique doit refléter la création sans redéploiement
        // (revalidatePath appelé par l'action de création — voir src/lib/admin/revalidate.ts).
        await page.goto(`${baseUrl}/produits/produit-test-e2e`, { waitUntil: "load" });
        const publicHeading = await page.$eval("h1", (el) => el.textContent).catch(() => null);
        assert(
          !!publicHeading && publicHeading.includes("Produit Test E2E"),
          `la fiche produit publique doit être accessible immédiatement, titre obtenu « ${publicHeading} »`
        );

        // Nettoyage : produit -> marque -> catégorie (ordre des dépendances).
        page.on("dialog", (d) => d.accept());
        await page.goto(`${baseUrl}/admin/produits`, { waitUntil: "load" });
        await page.click('tr:has-text("Produit Test E2E") button:has-text("Supprimer")');
        await page.waitForTimeout(500);
        await page.goto(`${baseUrl}/admin/marques`, { waitUntil: "load" });
        await page.click('tr:has-text("Marque Test E2E") button:has-text("Supprimer")');
        await page.waitForTimeout(500);
        await page.goto(`${baseUrl}/admin/categories`, { waitUntil: "load" });
        await page.click('tr:has-text("Catégorie Test E2E") button:has-text("Supprimer")');
        await page.waitForTimeout(500);
      },
    },

    {
      name: "un CUSTOMER qui rejoue une requête Server Action admin capturée se voit refuser la mutation",
      fn: async ({ page, browser, baseUrl }) => {
        await loginAsAdmin(page, baseUrl);

        await page.goto(`${baseUrl}/admin/reglages`, { waitUntil: "load" });
        const before = await page.$eval('input[name="marginPercent"]', (el) => el.value);
        const valueA = String(Number(before) + 1);
        const valueB = String(Number(before) + 2);

        // On snoope (sans intercepter — pas de route/abort, qui casserait le fetch
        // client et polluerait la page d'une erreur JS) la requête Server Action
        // réelle envoyée pour le changement vers `valueA`, appliqué légitimement.
        let capturedA = null;
        page.on("request", (req) => {
          if (!capturedA && req.method() === "POST" && req.headers()["next-action"]) {
            capturedA = { url: req.url(), headers: req.headers(), postData: req.postData() };
          }
        });
        await page.fill('input[name="marginPercent"]', valueA);
        await page.click('button:has-text("Enregistrer")');
        await page.waitForTimeout(500);
        assert(!!capturedA, "la requête Server Action du changement vers valueA doit avoir été capturée");
        assertEqual(await page.$eval('input[name="marginPercent"]', (el) => el.value), valueA, "le changement légitime vers valueA doit être appliqué");

        // Second changement légitime, vers une valeur différente `valueB` — la base
        // vaut maintenant valueB, distincte de la requête capturée (qui encode valueA).
        await page.fill('input[name="marginPercent"]', valueB);
        await page.click('button:has-text("Enregistrer")');
        await page.waitForTimeout(500);
        assertEqual(await page.$eval('input[name="marginPercent"]', (el) => el.value), valueB, "le second changement légitime vers valueB doit être appliqué");

        // Rejeu de la requête EXACTE capturée pour valueA, mais authentifié comme
        // CUSTOMER (pas ADMIN). Comme la base vaut désormais valueB (≠ valueA), un
        // rejeu accepté serait immédiatement visible : la valeur reviendrait à valueA.
        const customerContext = await browser.newContext();
        const customerPage = await customerContext.newPage();
        const custEmail = `customer-replay-${Date.now()}@example.com`;
        await customerPage.goto(`${baseUrl}/inscription`, { waitUntil: "load" });
        await customerPage.fill('input[name="displayName"]', "Customer Replay");
        await customerPage.fill('input[name="email"]', custEmail);
        await customerPage.fill('input[name="password"]', "motdepasse-solide-123");
        await customerPage.click('button[type="submit"]');
        await customerPage.waitForURL("**/compte", { timeout: 8000 });

        await customerPage.request.post(capturedA.url, {
          headers: { ...capturedA.headers, cookie: undefined }, // le cookie de session CUSTOMER du contexte s'applique
          data: capturedA.postData,
        });
        await customerContext.close();

        await page.goto(`${baseUrl}/admin/reglages`, { waitUntil: "load" });
        const after = await page.$eval('input[name="marginPercent"]', (el) => el.value);
        assertEqual(after, valueB, "un CUSTOMER ne doit jamais pouvoir modifier les réglages via un rejeu direct de Server Action");
      },
    },
  ],
};
