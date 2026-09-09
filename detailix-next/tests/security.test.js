"use strict";

const { assert } = require("./helpers");

module.exports = {
  name: "Sécurité — redirection ouverte, en-têtes",
  tests: [
    {
      name: "?next= pointant hors du site est ignoré après connexion (pas de redirection ouverte)",
      fn: async ({ page, baseUrl }) => {
        const email = `redirect-test-${Date.now()}@example.com`;
        await page.goto(`${baseUrl}/inscription`, { waitUntil: "load" });
        await page.fill('input[name="displayName"]', "Redirect Test");
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', "motdepasse-solide-123");
        await page.click('button[type="submit"]');
        await page.waitForURL("**/compte", { timeout: 8000 });
        await page.click('button:has-text("Déconnexion")');
        await page.waitForURL(`${baseUrl}/`, { timeout: 8000 });

        for (const malicious of ["https://evil.example.com", "//evil.example.com", "https:evil.example.com"]) {
          await page.goto(`${baseUrl}/connexion?next=${encodeURIComponent(malicious)}`, { waitUntil: "load" });
          await page.fill('input[name="email"]', email);
          await page.fill('input[name="password"]', "motdepasse-solide-123");
          await page.click('button[type="submit"]');
          await page.waitForURL((url) => url.href !== `${baseUrl}/connexion?next=${encodeURIComponent(malicious)}`, { timeout: 8000 });
          const finalUrl = page.url();
          assert(
            finalUrl.startsWith(baseUrl) && !finalUrl.includes("evil.example.com"),
            `next=${malicious} ne doit jamais rediriger hors du site, obtenu ${finalUrl}`
          );
          await page.click('button:has-text("Déconnexion")');
          await page.waitForURL(`${baseUrl}/`, { timeout: 8000 });
        }
      },
    },

    {
      name: "un ?next= interne légitime est bien respecté après connexion",
      fn: async ({ page, baseUrl }) => {
        const email = `redirect-ok-${Date.now()}@example.com`;
        await page.goto(`${baseUrl}/inscription`, { waitUntil: "load" });
        await page.fill('input[name="displayName"]', "Redirect OK");
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', "motdepasse-solide-123");
        await page.click('button[type="submit"]');
        await page.waitForURL("**/compte", { timeout: 8000 });
        await page.click('button:has-text("Déconnexion")');
        await page.waitForURL(`${baseUrl}/`, { timeout: 8000 });

        await page.goto(`${baseUrl}/connexion?next=%2Fcompte%2Fliste-envies`, { waitUntil: "load" });
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', "motdepasse-solide-123");
        await page.click('button[type="submit"]');
        await page.waitForURL("**/compte/liste-envies", { timeout: 8000 });
      },
    },

    {
      name: "les endpoints publics /api/recherche-index et /api/vehicules-arbre n'exposent pas le coût d'achat",
      fn: async ({ page, baseUrl }) => {
        await page.goto(`${baseUrl}/`, { waitUntil: "load" });
        const searchIndex = await page.evaluate((url) => fetch(url).then((r) => r.text()), `${baseUrl}/api/recherche-index`);
        assert(!searchIndex.includes("prixAchat"), "l'index de recherche ne doit jamais exposer le coût d'achat (marge interne)");

        const vehicleTree = await page.evaluate((url) => fetch(url).then((r) => r.text()), `${baseUrl}/api/vehicules-arbre`);
        assert(!vehicleTree.includes("prixAchat"), "l'arbre véhicule ne doit jamais exposer le coût d'achat");
      },
    },

    {
      name: "l'ajout à la liste d'envies est rate-limité (pas d'écriture en base sans limite)",
      fn: async ({ page, baseUrl }) => {
        const email = `wishlist-ratelimit-${Date.now()}@example.com`;
        await page.goto(`${baseUrl}/inscription`, { waitUntil: "load" });
        await page.fill('input[name="displayName"]', "Wishlist Ratelimit");
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', "motdepasse-solide-123");
        await page.click('button[type="submit"]');
        await page.waitForURL("**/compte", { timeout: 8000 });

        await page.goto(`${baseUrl}/produits/303-aerospace-protectant`, { waitUntil: "load" });

        // Chaque toast reste visible 2,5s (voir Toast.tsx, plusieurs peuvent
        // s'empiler) : un intervalle court entre les clics garde tout le lot
        // dans le DOM le temps du test, sans dépendre de l'ordre d'expiration.
        let sawRateLimitMessage = false;
        for (let i = 0; i < 32 && !sawRateLimitMessage; i++) {
          await page.click('button:has-text("Ajouter à ma liste d\'envies")');
          await page.waitForTimeout(50);
          const toasts = await page.$$eval(".toast", (els) => els.map((el) => el.textContent ?? ""));
          sawRateLimitMessage = toasts.some((t) => t.includes("Trop de tentatives"));
        }
        assert(sawRateLimitMessage, "après une trentaine d'appels rapprochés, le rate-limit doit se déclencher (message affiché)");
      },
    },
  ],
};
