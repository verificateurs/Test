"use strict";

const { assert } = require("./helpers");

module.exports = {
  name: "Authentification — inscription, connexion, déconnexion, RBAC",
  tests: [
    {
      name: "inscription -> connexion auto, admin refusé à un CUSTOMER, déconnexion, reconnexion",
      fn: async ({ page, baseUrl }) => {
        const email = `auth-test-${Date.now()}@example.com`;

        // 1. Inscription -> redirigé et connecté.
        await page.goto(`${baseUrl}/inscription`, { waitUntil: "load" });
        await page.fill('input[name="displayName"]', "Camille Test");
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', "motdepasse-solide-123");
        await page.click('button[type="submit"]');
        await page.waitForURL("**/compte", { timeout: 8000 });

        // 2. /admin refusé pour un CUSTOMER (redirection loin de /admin).
        await page.goto(`${baseUrl}/admin`, { waitUntil: "load" });
        assert(!page.url().includes("/admin"), `un CUSTOMER ne doit pas rester sur /admin, url = ${page.url()}`);

        // 3. Déconnexion.
        await page.goto(`${baseUrl}/compte`, { waitUntil: "load" });
        await page.click('button:has-text("Déconnexion")');
        await page.waitForURL(`${baseUrl}/`, { timeout: 8000 });

        // 4. /compte à nouveau refusé après déconnexion.
        await page.goto(`${baseUrl}/compte`, { waitUntil: "load" });
        assert(page.url().includes("/connexion"), `/compte après déconnexion doit rediriger vers /connexion, url = ${page.url()}`);

        // 5. Mauvais mot de passe refusé.
        await page.goto(`${baseUrl}/connexion`, { waitUntil: "load" });
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', "mauvais-mot-de-passe");
        await page.click('button[type="submit"]');
        await page.waitForTimeout(500);
        assert(page.url().includes("/connexion"), "un mauvais mot de passe ne doit pas connecter l'utilisateur");
        const errorText = await page.$eval(".form-error", (el) => el.textContent).catch(() => null);
        assert(!!errorText, "un message d'erreur doit être affiché pour un mauvais mot de passe");

        // 6. Bon mot de passe : reconnexion OK, le champ email n'a pas été vidé par l'échec précédent.
        const emailValue = await page.$eval('input[name="email"]', (el) => el.value);
        assert(emailValue === email, `le champ email doit être repréempli après l'échec, obtenu « ${emailValue} »`);
        await page.fill('input[name="password"]', "motdepasse-solide-123");
        await page.click('button[type="submit"]');
        await page.waitForURL("**/compte", { timeout: 15000 });
      },
    },
  ],
};
