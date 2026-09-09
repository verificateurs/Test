# Detailix — application Next.js

Réécriture complète du prototype vanilla (dossier parent) sur **Next.js 16
(App Router) + Prisma**, avec authentification, paiement et back-office réels
côté serveur. Fonctionnellement complète et prête pour un test par de vrais
utilisateurs (voir « Limites connues » ci-dessous pour ce qui reste
volontairement simplifié).

Le site vanilla d'origine (`../index.html`, `../assets/`, `../data/`) reste
intact et fonctionnel : cette application le remplace mais ne le supprime pas.

## Fonctionnalités

- **Catalogue** (Prisma/SQLite en dev) : catégories, marques, avis, produits,
  véhicules. Le prix de vente n'est jamais stocké : calculé à partir du coût
  (`Product.prixAchat`) et de la marge globale (`Setting.marginPercent`),
  modifiable depuis le back-office et appliqué immédiatement (revalidation).
- **Pages générées statiquement** pour le SEO (contenu dans le HTML,
  vérifiable JS désactivé) : accueil, catégories, marques, produits,
  véhicules, préparateurs, blog. `sitemap.xml`/`robots.txt`, JSON-LD
  `Product`/`BreadcrumbList`/`ItemList`/`BlogPosting`. Pas de balisage d'avis
  (`aggregateRating`/`review`) tant que les avis restent des données
  d'exemple — cela violerait les règles de données structurées de Google.
- **Comptes** : inscription/connexion (mots de passe hachés en scrypt,
  `node:crypto`, aucune dépendance native), sessions par cookie httpOnly,
  rôles CUSTOMER/PRO/ADMIN, historique de commandes (`/compte/commandes`,
  strictement filtré par l'utilisateur connecté), liste d'envies.
- **Panier + tunnel de commande** : panier client (localStorage), adresse de
  livraison, code promo, remise pro automatique. Le total facturé est
  **toujours recalculé côté serveur** depuis le catalogue en base — jamais
  depuis une valeur envoyée par le client.
- **Paiement Stripe** (Checkout Session hébergée, webhook signé) : sans
  `STRIPE_SECRET_KEY`, bascule en mode démonstration explicite (commande
  marquée payée directement, bandeau visible). Emails de confirmation via
  Resend, best-effort (ne bloque jamais une commande).
- **Back-office** (`/admin`, protégé par rôle) : produits, marques,
  catégories, véhicules, codes promo, commandes, utilisateurs, articles de
  blog, réglages (marge, seuil de livraison offerte, remise pro),
  import/export catalogue.
- **Mon garage** : véhicule(s) mémorisé(s) (localStorage), badge de
  compatibilité produit recalculé côté client sans rechargement de page.
- **Recherche interne** avec autocomplétion (produits + marques).
- **Préparateurs partenaires** (Shiftech, BR Performance...) et **blog /
  guides** : contenu texte brut, jamais de HTML injecté côté client (voir
  la CSP ci-dessous).

## Développement

```bash
npm install
npm run db:reset   # crée le schéma SQLite et charge le catalogue
npm run dev        # http://localhost:3000
npm run build && npm start   # build de production + serveur
```

Copier `.env.example` en `.env` et compléter selon les besoins — toute
variable absente fait basculer la fonctionnalité correspondante en mode
démonstration explicite (jamais un faux succès silencieux). Notamment,
définir `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` **avant** de seed pour
obtenir un premier compte ADMIN : sur une base fraîche sans ces variables,
`/admin` reste inatteignable (personne n'a de compte).

## Tests

```bash
npm run test:e2e
```

Suite Playwright de bout en bout (`tests/`) : base SQLite jetable, seed
(catalogue + compte admin de test), build, `next start`, exécution de la
suite, puis arrêt et nettoyage — orchestré par `tests/e2e.js`, sans état
partagé avec la base de développement (`prisma/dev.db`). Couvre
l'inscription/connexion, le panier et le tunnel de commande (y compris un
prix trafiqué côté client, toujours recalculé serveur), le CRUD admin, le
refus serveur d'une Server Action admin rejouée par un CUSTOMER authentifié
(pas seulement un contrôle d'interface), la liste d'envies, le comparateur,
la remise pro, l'historique de commandes (avec vérification anti-IDOR), le
garage/recherche/préparateurs, le blog (avec une vérification explicite que
du HTML injecté dans un article s'affiche échappé, jamais exécuté), et la
redirection ouverte sur `?next=`.

`npm run test:e2e -- <motif>` limite l'exécution aux fichiers dont le nom
contient `<motif>` (ex. `npm run test:e2e -- checkout`).

## Base de données

- **Développement** : SQLite (`prisma/dev.db`, `DATABASE_URL="file:./dev.db"`),
  aucun compte externe requis.
- **Production** : passer `provider` à `postgresql` dans `prisma/schema.prisma`
  et fournir `DATABASE_URL` (Neon / Supabase). Aucune requête à réécrire.

## Sécurité

- En-têtes de sécurité (`src/middleware.ts`, pas `next.config.ts`) : CSP,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. La CSP
  autorise `script-src 'self' 'unsafe-inline'` — choix assumé et documenté en
  commentaire dans `middleware.ts` (les pages statiques ne peuvent pas
  porter de nonce par requête), dont la sûreté repose sur l'absence de tout
  `dangerouslySetInnerHTML` recevant du contenu utilisateur (`grep -rn
  dangerouslySetInnerHTML src/` ne doit renvoyer que `JsonLd.tsx`).
- Autorisation admin en profondeur : filtre Edge (cookie, non faisant
  autorité) + `admin/layout.tsx` (`requireAdmin()`, faisant autorité) +
  chaque Server Action admin revérifie `requireAdmin()` elle-même — vérifié
  par un test qui rejoue une requête Server Action admin capturée en tant
  que CUSTOMER authentifié et confirme le refus.
- Prix, total de commande et remise pro : toujours recalculés côté serveur.
- Redirection `?next=` (connexion) filtrée par `safeRedirectPath()` (chemin
  interne uniquement) — pas de redirection ouverte.
- IDOR : historique de commandes et liste d'envies systématiquement
  filtrés par l'utilisateur de la session, jamais par un identifiant pris
  dans l'URL ou le payload client.

### Vulnérabilités npm connues

`npm audit` signale `mysql2` (pilote MySQL non utilisé — on est sur SQLite/
Postgres) et, selon les versions, `deepmerge-ts` : ce sont des dépendances
transitives du **CLI Prisma**, présentes uniquement au build/CLI, jamais dans le
bundle navigateur ni au runtime de production. Ne pas downgrader Prisma vers une
version majeure antérieure pour ces alertes.

## Limites connues

- **Limiteur de débit** : partagé via Upstash Redis quand
  `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` sont renseignées
  (voir `.env.example`), sinon repli en mémoire du processus Node —
  mono-instance, ne survit pas à un redémarrage ni à plusieurs instances
  serverless (voir `src/lib/auth/rateLimit.ts`).
- **Modes démonstration explicites** sans clés externes : `STRIPE_SECRET_KEY`
  absent → commande marquée payée directement (bandeau visible) ;
  `RESEND_API_KEY` absent → email loggé, jamais envoyé, ne bloque jamais la
  commande.
- **Avis et fiches préparateurs** : données d'exemple pour prototypage,
  explicitement signalées comme telles (bandeau pied de page, `_note` dans
  `data/preparateurs.json`) — à remplacer avant mise en production, et
  aucun balisage `aggregateRating`/`review` n'est émis tant qu'elles le
  restent.
