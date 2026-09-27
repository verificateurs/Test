# Detailix — application Next.js

Boutique en ligne de préparation et d'esthétique automobile : catalogue (1637 produits, 60 marques), sélecteur de véhicule avec badge de compatibilité, wishlist, avis produits, panier, tunnel de commande, compte client, back-office admin complet (produits, commandes, marques, utilisateurs, promos), 2FA TOTP admin, annuaire de préparateurs.

Stack : Next.js 16 (App Router, Turbopack) · React 19 · Prisma 6 + Postgres (Neon) · Vitest.

**En production** : https://detailix-next.vercel.app (Vercel, base Postgres Neon).

## Lancer le site en local

Prérequis : Node.js 20+, et une base Postgres accessible (Neon gratuit, ou Postgres local/Docker).

```bash
npm install --legacy-peer-deps
cp .env.example .env
# Ouvrir .env et renseigner DATABASE_URL avec une vraie chaîne de connexion
# Postgres (voir .env.example). Le plus simple : récupérer celle de Neon avec
# `vercel env pull .env.local` si le dossier est lié au projet Vercel
# (`vercel link`), ou créer une branche Neon dédiée au dev.

npm run setup   # génère le client Prisma, pousse le schéma, seed le catalogue
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Créer un compte administrateur

```bash
ADMIN_EMAIL="admin@detailix.local" ADMIN_PASSWORD="un-mot-de-passe-fort" npm run admin:create
```

Se connecter sur `/connexion` avec ces identifiants, puis accéder au back-office sur `/admin`.

### Autres commandes utiles

| Commande | Effet |
|---|---|
| `npm run build` | build de production |
| `npm start` | sert le build de production |
| `npm run lint` | ESLint |
| `npm test` | tests Vitest (70 tests) |
| `npm run db:studio` | interface graphique Prisma Studio sur la base locale |
| `npm run db:seed` | re-seed le catalogue sans toucher au schéma |

### Régénérer/étendre le catalogue

Le catalogue (153 produits d'origine → 1637 avec variantes) est généré depuis `data/generate-products.ts` et `data/templates/*.ts` (script idempotent, ne duplique pas au relancement). Modifier les templates puis relancer `npm run db:seed` pour republier.

## Déploiement (Vercel)

Le dossier est lié au projet Vercel `detailix-next` (`vercel link`). Pour déployer :

```bash
npx vercel deploy --prod
```

- Base Postgres : Neon, connectée via l'onglet **Storage** du projet Vercel (intégration marketplace — fournit `DATABASE_URL` automatiquement).
- **Root Directory à vérifier** : le projet Vercel doit avoir `detailix-next` comme Root Directory (Settings → General) pour que les déploiements déclenchés par un `git push` (pas seulement `vercel deploy` en CLI) buildent le bon dossier. À confirmer/corriger manuellement dans le dashboard si un push GitHub déploie autre chose que ce site.
- `pricing-config.json` et `preparateurs.json` vivent dans `detailix-next/data/` (pas au niveau racine du repo) car ils sont lus au runtime — un chemin `../data/...` ne fonctionnerait pas une fois déployé (seul le sous-dossier `detailix-next/` est buildé).
- Client Prisma généré via le générateur standard `prisma-client-js` (pas de `output` custom) — un output custom empêche Next.js de tracer correctement le moteur de requête (`.so.node`) vers la fonction serverless.

## Notes de sécurité / configuration

- `AUTH_SECRET` dans `.env` doit être une vraie valeur aléatoire en production (déjà généré aléatoirement sur Vercel).
- La CSP (`proxy.ts`) autorise `'unsafe-inline'` sur `style-src` uniquement — nécessaire car styled-jsx (utilisé dans la quasi-totalité des composants) n'a pas de support natif de nonce CSP en App Router. `script-src` reste strictement en nonce par requête.
- Aucune vraie photo produit : les visuels sont des placeholders SVG générés par catégorie (choix délibéré — pas de droit d'usage sur des photos de sites concurrents).
- `data/preparateurs.json` contient uniquement des réseaux fictifs de démonstration, à remplacer par de vrais partenaires avant mise en production.
