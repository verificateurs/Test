"use strict";

const { assert, assertEqual, gotoSite } = require("./helpers");

// Scénario réel visé : le README annonce un futur import de catalogue depuis un
// back-office. Ces tests injectent des données hostiles dans les JSON servis et
// vérifient qu'aucune ne devient du code exécutable.
//
// Ces tests DOIVENT échouer si escapeHtml (assets/app.js) repart sur l'astuce
// textContent/innerHTML, qui n'échappe pas les guillemets et laisse donc sortir
// d'une valeur d'attribut. Vérifié : ils échouent bien contre cette version.

const HOSTILE_ID = 'evil" onmouseover="window.__xssFired()" data-x="';
const HOSTILE_NAME = '<img src=x onerror="window.__xssFired()">Produit piégé';
const HOSTILE_FORMAT = '" autofocus onfocus="window.__xssFired()';

/** Sert un catalogue empoisonné et signale tout déclenchement de charge utile. */
async function withHostileCatalogue(page, baseUrl, { dropCompatibilite = false } = {}) {
  const fired = { value: false };
  await page.exposeFunction("__xssFired", () => {
    fired.value = true;
  });

  await page.route("**/data/products.json", async (route) => {
    const response = await route.fetch();
    const json = await response.json();
    json.products[0].id = HOSTILE_ID;
    json.products[0].name = HOSTILE_NAME;
    json.products[0].format = HOSTILE_FORMAT;
    if (dropCompatibilite) delete json.products[1].compatibilite;
    await route.fulfill({ response, json });
  });

  await gotoSite(page, baseUrl);
  return fired;
}

module.exports = {
  name: "Sécurité — injection dans le catalogue et le stockage local",
  tests: [
    {
      name: "un identifiant produit hostile ne s'échappe pas de son attribut",
      fn: async ({ page, baseUrl }) => {
        const fired = await withHostileCatalogue(page, baseUrl);

        // Si l'attribut avait été refermé, l'id serait tronqué à "evil".
        const found = await page.evaluate(
          (id) => [...document.querySelectorAll(".product-card")].some((el) => el.dataset.productId === id),
          HOSTILE_ID
        );
        assert(found, "l'identifiant hostile devrait être conservé entier dans data-product-id");

        const strayHandlers = await page.$$eval("[onmouseover], [onerror], [onfocus]", (els) => els.length);
        assertEqual(strayHandlers, 0, "aucun gestionnaire d'événement inline ne doit avoir été créé");

        // Survol : un attribut échappé déclencherait le handler injecté.
        await page.hover(".product-card");
        await page.waitForTimeout(150);
        assertEqual(fired.value, false, "aucune charge utile ne doit s'exécuter au survol");
      },
    },

    {
      name: "un nom de produit contenant du HTML est rendu comme du texte",
      fn: async ({ page, baseUrl }) => {
        const fired = await withHostileCatalogue(page, baseUrl);

        const renderedName = await page.evaluate(
          (id) => {
            const card = [...document.querySelectorAll(".product-card")].find((el) => el.dataset.productId === id);
            return card ? card.querySelector(".product-name").textContent : null;
          },
          HOSTILE_ID
        );
        assertEqual(renderedName, HOSTILE_NAME, "le nom doit apparaître littéralement, pas être interprété");

        const injectedImages = await page.$$eval("img", (els) => els.length);
        assertEqual(injectedImages, 0, "la balise <img> injectée ne doit pas exister dans le DOM");
        assertEqual(fired.value, false, "onerror ne doit jamais se déclencher");
      },
    },

    {
      name: "un produit piégé reste utilisable (ajout au panier)",
      fn: async ({ page, baseUrl }) => {
        await withHostileCatalogue(page, baseUrl);

        await page.evaluate((id) => {
          const card = [...document.querySelectorAll(".product-card")].find((el) => el.dataset.productId === id);
          card.querySelector(".btn-add-cart").click();
        }, HOSTILE_ID);
        await page.waitForTimeout(200);

        const count = await page.$eval("#cartCount", (el) => el.textContent);
        assertEqual(count, "1", "l'échappement ne doit pas casser la fonctionnalité");
      },
    },

    {
      name: "un produit sans champ compatibilite ne casse pas le rendu",
      fn: async ({ page, baseUrl }) => {
        await withHostileCatalogue(page, baseUrl, { dropCompatibilite: true });

        const cards = await page.$$eval(".brand-card", (els) => els.length);
        assert(cards > 0, "la grille des marques doit rester rendue malgré la donnée manquante");

        const badges = await page.$$eval(".compat-badge", (els) => els.length);
        assert(badges > 0, "les badges de compatibilité doivent rester affichés");
      },
    },

    {
      name: "un panier corrompu dans le stockage local est ignoré, pas fatal",
      fn: async ({ page, baseUrl }) => {
        await gotoSite(page, baseUrl);
        await page.evaluate(() => localStorage.setItem("detailix_cart_v1", '{"pas":"un tableau"}'));
        await gotoSite(page, baseUrl);

        const count = await page.$eval("#cartCount", (el) => el.textContent);
        assertEqual(count, "0", "un panier invalide doit repartir à vide");

        const cards = await page.$$eval(".brand-card", (els) => els.length);
        assert(cards > 0, "la page doit rester entièrement fonctionnelle");
      },
    },

    {
      name: "une quantité aberrante injectée dans le stockage est ignorée",
      fn: async ({ page, baseUrl }) => {
        await gotoSite(page, baseUrl);
        await page.evaluate(() =>
          localStorage.setItem("detailix_cart_v1", JSON.stringify([{ productId: "meguiars-cire-carnauba", qty: -5 }]))
        );
        await gotoSite(page, baseUrl);

        const count = await page.$eval("#cartCount", (el) => el.textContent);
        assertEqual(count, "0", "une quantité négative doit invalider le panier stocké");
      },
    },
  ],
};
