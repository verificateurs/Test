# AutoPrep — prototype

Prototype statique pour le site e-commerce de cosmétique et préparation esthétique automobile décrit dans le cahier des charges.

Ce prototype couvre :

- **Marques par type de préparation** (§6) : pour chaque catégorie (cosmétique carrosserie, polish/céramique, jantes, kits carrosserie, éclairage, échappement sport, covering/vitres teintées), plusieurs marques avec note, avis clients et une préférence recommandée.
- **Produits & panier d'achat** : sous chaque marque, des produits achetables avec leur prix, un panier persistant (localStorage), et un tunnel de commande simulé en 3 étapes (livraison, paiement fictif, confirmation) — 100% démo, aucun back-end ni prestataire de paiement réel.
- **Préparateurs partenaires** (§3) : réseaux Shiftech et BR Performance, avec leurs centres par ville, sélectionnables via un menu déroulant, et les avis clients associés.
- Une passe de polish visuel (police Sora/Inter, animations d'apparition au scroll, micro-interactions, panneau panier et tunnel d'achat animés) — voir `prefers-reduced-motion` respecté pour l'accessibilité.

## Données modifiables

Tout le contenu vit dans des fichiers JSON, indépendants du code d'affichage :

- `data/brands.json` — marques, catégories, avis.
- `data/preparateurs.json` — réseaux, centres par ville, avis.
- `data/products.json` — produits vendus par marque (`prixAchat` = coût, jamais de prix de vente stocké en dur).
- `data/pricing-config.json` — **marge globale modifiable** (`marginPercent`). Changer cette seule valeur recalcule automatiquement tous les prix affichés (fiches produit, panier, récapitulatif de commande) au prochain chargement de la page.

Modifier ces fichiers (ajouter une marque, un produit, un centre, un avis, changer la marge...) suffit à mettre à jour le site — aucune modification du HTML/CSS/JS n'est nécessaire. Ce sont des données d'exemple destinées à être remplacées/complétées par un import réel depuis le futur back-office (cf. cahier des charges §4.2).

## Lancer le prototype en local

Le chargement des données se fait via `fetch`, ce qui nécessite un serveur HTTP local (ouvrir `index.html` directement dans le navigateur ne fonctionnera pas à cause des restrictions CORS sur `file://`) :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000/index.html
```

## À suivre

- Contenu réel du cahier des charges restant à construire : sélecteur de véhicule, catalogue produits complet, compte client, back-office, vrai prestataire de paiement (Stripe, etc.).
- Des sous-agents dédiés sont disponibles dans `.claude/agents/` (architect, researcher, developer, debugger, tester, reviewer, security, performance, ui-ux) pour la suite du développement.
