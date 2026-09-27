# Detailix — application Next.js

Boutique en ligne de préparation et d'esthétique automobile : catalogue (1637 produits, 60 marques), sélecteur de véhicule avec badge de compatibilité, wishlist, avis produits, panier, tunnel de commande, compte client, back-office admin complet (produits, commandes, marques, utilisateurs, promos), 2FA TOTP admin, annuaire de préparateurs.

Stack : Next.js 16 (App Router, Turbopack) · React 19 · Prisma 6 + SQLite · Vitest.

## Lancer le site en local

Prérequis : Node.js 20+.

```bash
npm install --legacy-peer-deps
cp .env.example .env
# Ouvrir .env et renseigner DATABASE_URL avec un CHEMIN ABSOLU
# vers detailix-next/prisma/dev.db (voir les commentaires dans .env.example —
# un chemin relatif casse le site avec "Unable to open the database file").

npm run setup   # génère le client Prisma, crée la base, seed le catalogue
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

## Notes de sécurité / configuration

- `AUTH_SECRET` dans `.env` doit être une vraie valeur aléatoire en production (voir commentaire dans `.env.example`).
- La CSP (`proxy.ts`) autorise `'unsafe-inline'` sur `style-src` uniquement — nécessaire car styled-jsx (utilisé dans la quasi-totalité des composants) n'a pas de support natif de nonce CSP en App Router. `script-src` reste strictement en nonce par requête.
- Aucune vraie photo produit : les visuels sont des placeholders SVG générés par catégorie (choix délibéré — pas de droit d'usage sur des photos de sites concurrents).
- `data/preparateurs.json` contient uniquement des réseaux fictifs de démonstration, à remplacer par de vrais partenaires avant mise en production.
