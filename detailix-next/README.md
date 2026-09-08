# Detailix — application Next.js (migration en cours)

Réécriture du prototype vanilla (dossier parent) sur **Next.js 16 (App Router) +
Prisma**, pour un vrai référencement (pages HTML par produit/catégorie/véhicule)
et, aux modules suivants, une authentification et un paiement réels côté serveur.

Le site vanilla d'origine (`../index.html`, `../assets/`, `../data/`) reste
intact et fonctionnel pendant toute la migration. La bascule se fera quand cette
application couvrira l'ensemble de ses fonctionnalités.

## Ce qui est en place (module 3)

- **Catalogue en base** (Prisma) : catégories, marques, avis, produits,
  véhicules, plus les tables comptes/commandes/promos préparées pour les modules
  suivants. Le prix de vente n'est jamais stocké : il est calculé à partir du
  coût et de la marge globale (`Setting.marginPercent`).
- **Seed** depuis les `../data/*.json` du prototype : `npm run db:seed`. Sur une
  base fraîche, aucun compte n'existe donc le back-office `/admin` est
  inatteignable : définir `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` (voir
  `.env.example`) avant de seed pour obtenir un premier compte ADMIN — sinon
  cette étape est silencieusement ignorée.
- **Pages générées statiquement** (contenu dans le HTML, vérifiable JS désactivé) :
  accueil, `/categories`, `/categories/[id]`, `/marques`, `/marques/[id]`,
  `/produits/[id]`, `/vehicules`, `/vehicules/[slug]`.
- **SEO** : `title`/`description` uniques, canonical, Open Graph, JSON-LD
  `Product` + `offers` (prix, disponibilité), `BreadcrumbList`, `ItemList`,
  `sitemap.xml`, `robots.txt`. Pas de balisage d'avis (`aggregateRating`/`review`)
  tant que les avis sont des exemples — cela violerait les règles Google.
- **Pages véhicule dé-dupliquées** : deux modèles au même ensemble de produits
  compatibles (mêmes codes moteur) ne produisent qu'une page indexable ; la ou
  les autres passent en `noindex` et sont exclues du sitemap.
- **En-têtes de sécurité** au niveau serveur (`next.config.ts`) : CSP,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

## Développement

```bash
npm install
npm run db:reset   # crée le schéma SQLite et charge le catalogue
npm run dev        # http://localhost:3000
npm run build && npm start   # build de production + serveur
```

## Base de données

- **Développement** : SQLite (`prisma/dev.db`, `DATABASE_URL="file:./dev.db"`),
  aucun compte externe requis.
- **Production** : passer `provider` à `postgresql` dans `prisma/schema.prisma`
  et fournir `DATABASE_URL` (Neon / Supabase). Aucune requête à réécrire.

## Vulnérabilités npm connues

`npm audit` signale `mysql2` (pilote MySQL non utilisé — on est sur SQLite/
Postgres) et, selon les versions, `deepmerge-ts` : ce sont des dépendances
transitives du **CLI Prisma**, présentes uniquement au build/CLI, jamais dans le
bundle navigateur ni au runtime de production. Ne pas downgrader Prisma vers une
version majeure antérieure pour ces alertes.

## À venir (modules 4-8)

Authentification réelle (argon2id, sessions httpOnly, CSRF, anti-brute-force),
panel admin protégé côté serveur, tunnel de commande, codes promo, paiement
Stripe (clé secrète côté serveur, webhook signé), emails de confirmation, puis
reprise du garage/recherche/comparateur et bascule finale.
