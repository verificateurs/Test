"use strict";

const { assert, ADMIN_EMAIL, ADMIN_PASSWORD } = require("./helpers");

async function loginAsAdmin(page, baseUrl) {
  await page.goto(`${baseUrl}/connexion`, { waitUntil: "load" });
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/compte", { timeout: 8000 });
}

module.exports = {
  name: "Blog / guides",
  tests: [
    {
      name: "les articles seedés s'affichent en liste et en détail",
      fn: async ({ page, baseUrl }) => {
        await page.goto(`${baseUrl}/blog`, { waitUntil: "load" });
        const tiles = await page.$$(".tile");
        assert(tiles.length > 0, "au moins un article doit être listé");

        await tiles[0].click();
        await page.waitForURL("**/blog/**", { timeout: 5000 });
        const heading = await page.$eval("h1", (el) => el.textContent);
        assert(heading.length > 0, "la fiche article doit avoir un titre");
        const paragraphs = await page.$$(".article-body p");
        assert(paragraphs.length > 0, "le contenu doit être découpé en paragraphes");
      },
    },

    {
      name: "un admin publie un article avec du balisage dans le texte : il s'affiche échappé, jamais exécuté",
      fn: async ({ page, baseUrl }) => {
        await loginAsAdmin(page, baseUrl);

        const marker = `xss-marker-${Date.now()}`;
        await page.goto(`${baseUrl}/admin/articles/nouveau`, { waitUntil: "load" });
        await page.fill('input[name="title"]', "Article Test E2E");
        await page.fill('textarea[name="excerpt"]', "Résumé de test.");
        await page.fill(
          'textarea[name="content"]',
          `Premier paragraphe.\n\n<img src=x onerror="window.__${marker}=true">Second paragraphe avec balise.`
        );
        await page.click('button:has-text("Publier l\'article")');
        await page.waitForURL("**/admin/articles", { timeout: 8000 });
        assert(
          await page.$eval("body", (el) => el.textContent.includes("Article Test E2E")),
          "l'article créé doit apparaître dans la liste admin"
        );

        await page.goto(`${baseUrl}/blog/article-test-e2e`, { waitUntil: "load" });
        const executed = await page.evaluate((m) => window[`__${m}`], marker);
        assert(!executed, "le contenu ne doit jamais être interprété comme HTML/JS — la balise doit rester du texte affiché");

        const bodyText = await page.$eval(".article-body", (el) => el.textContent);
        assert(bodyText.includes("<img"), "la balise doit apparaître telle quelle, comme texte échappé, dans le rendu");

        const imgCount = await page.$$eval(".article-body img", (els) => els.length);
        assert(imgCount === 0, "aucun élément <img> réel ne doit avoir été créé dans le DOM");

        // Nettoyage.
        page.on("dialog", (d) => d.accept());
        await page.goto(`${baseUrl}/admin/articles`, { waitUntil: "load" });
        await page.click('tr:has-text("Article Test E2E") button:has-text("Supprimer")');
        await page.waitForTimeout(500);
      },
    },
  ],
};
