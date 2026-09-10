# Detailix — prototype

Prototype statique pour le site e-commerce de cosmétique et préparation esthétique automobile décrit dans le cahier des charges.

Ce prototype couvre :

- **Marques par type de préparation** (§6) : pour chaque catégorie (cosmétique carrosserie, polish/céramique, jantes, kits carrosserie, éclairage, échappement sport, covering/vitres teintées), plusieurs marques avec note, avis clients et une préférence recommandée.
- **Filtres croisés** : prix maximum, note minimale, "recommandé uniquement", appliqués en direct sur la catégorie affichée.
- **Produits & panier d'achat** : sous chaque marque, des produits achetables avec leur prix, une fiche produit dédiée (clic sur la carte), un indicateur de délai de livraison, un panier persistant (localStorage), et un tunnel de commande simulé en 3 étapes (livraison, paiement fictif, confirmation) — 100% démo, aucun back-end ni prestataire de paiement réel.
- **Sélecteur de véhicule & "mon garage"** (§5) : sélection en cascade marque → modèle → motorisation → code moteur, un ou plusieurs véhicules enregistrés (localStorage), et un badge de compatibilité sur les produits liés au véhicule (kits carrosserie, éclairage, échappement sport). Naviguer sans véhicule sélectionné reste toujours possible.
- **Recherche interne avec autocomplétion** : recherche en direct sur les marques et les produits depuis le header.
- **Compte client simulé & historique de commandes** : connexion par simple pseudo (aucune vraie authentification), historique des commandes passées conservé en local.
- **Préparateurs partenaires** (§3) : réseaux Shiftech et BR Performance, avec leurs centres par ville, sélectionnables via un menu déroulant, et les avis clients associés.
- Une passe de polish visuel (police Sora/Inter, animations d'apparition au scroll, micro-interactions, panneaux et modales animés) — `prefers-reduced-motion` respecté pour l'accessibilité.

## Données modifiables

Tout le contenu vit dans des fichiers JSON, indépendants du code d'affichage :

- `data/brands.json` — marques, catégories, avis.
- `data/preparateurs.json` — réseaux, centres par ville, avis.
- `data/products.json` — produits vendus par marque (`prixAchat` = coût, jamais de prix de vente stocké en dur ; `compatibilite` = `"universel"` ou `{type, codes}` référençant `data/vehicles.json`).
- `data/pricing-config.json` — **marge globale modifiable** (`marginPercent`). Changer cette seule valeur recalcule automatiquement tous les prix affichés (fiches produit, panier, récapitulatif de commande) au prochain chargement de la page.
- `data/vehicles.json` — nomenclature véhicule d'exemple (marques/modèles/motorisations/codes moteur) pour le sélecteur "mon garage".

Modifier ces fichiers (ajouter une marque, un produit, un véhicule, un centre, un avis, changer la marge...) suffit à mettre à jour le site — aucune modification du HTML/CSS/JS n'est nécessaire. Ce sont des données d'exemple destinées à être remplacées/complétées par un import réel depuis le futur back-office (cf. cahier des charges §4.2).

## Sécurité

- **Échappement** : `escapeHtml` (dans `assets/app.js`) échappe `& < > " '`. Sa sortie est donc sûre aussi bien entre deux balises que **dans une valeur d'attribut**. Ne jamais la remplacer par l'astuce `textContent`/`innerHTML`, qui laisse passer les guillemets et permet de sortir d'un attribut (XSS). Un test automatisé injecte des données hostiles dans le catalogue et échoue si la protection saute.
- **CSP** : politique stricte déclarée en `<meta>` dans `index.html` (`default-src 'self'`, aucun `unsafe-inline`). Le site ne contient volontairement ni script ni style inline pour la rendre applicable.
- **En-têtes HTTP** : le fichier `_headers` (lu par Netlify et Cloudflare Pages) ajoute `frame-ancestors`, `X-Content-Type-Options`, `Permissions-Policy`, `HSTS`. ⚠️ GitHub Pages ne supporte pas les en-têtes personnalisés : sur cet hébergeur, seule la CSP en `<meta>` s'applique.
- **Données non fiables** : tout ce qui sort du `localStorage` est validé par une garde de forme (`assets/storage.js`) avant usage — un stockage trafiqué à la main est ignoré, il ne casse pas la page. Idem pour les champs de catalogue absents ou mal formés.
- **Limites** : le compte et le paiement sont **simulés**, sans back-end. Aucune authentification réelle n'est possible côté client — ne jamais présenter cet écran comme une protection.

## Stockage local (navigateur) et données personnelles

Le prototype n'a pas de back-end : plusieurs fonctionnalités utilisent le `localStorage` du navigateur, propre à chaque visiteur/appareil. Rien n'est envoyé à un serveur.

- `detailix_cart_v1` — contenu du panier.
- `detailix_garage_v1` — véhicules enregistrés dans "mon garage".
- `detailix_account_v1` — nom d'affichage du compte simulé.
- `detailix_orders_v1` — historique des commandes, plafonné aux 20 dernières. **Contient le nom et l'adresse de livraison saisis** au tunnel de commande.

Deux garde-fous RGPD, puisque le « compte » ne cloisonne rien réellement :

- la **déconnexion efface l'historique de commandes**, pour qu'un autre pseudo utilisé sur le même navigateur ne voie pas les commandes du précédent ;
- un bouton **« Effacer toutes mes données locales »** (modale Mon compte) supprime les quatre clés d'un coup.

## Lancer le prototype en local

Le chargement des données se fait via `fetch`, ce qui nécessite un serveur HTTP local (ouvrir `index.html` directement dans le navigateur ne fonctionnera pas à cause des restrictions CORS sur `file://`) :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000/index.html
```

## À suivre

- Contenu réel du cahier des charges restant à construire : catalogue produits complet et réel, back-office d'administration, espace professionnel.
- Vrai prestataire de paiement (Stripe, etc.) — nécessite un back-end, hors périmètre d'un prototype statique.
- Des sous-agents dédiés sont disponibles dans `.claude/agents/` (architect, researcher, developer, debugger, tester, reviewer, security, performance, ui-ux) pour la suite du développement.
