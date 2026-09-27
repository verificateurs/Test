# Analyse du prototype Detailix (repo verificateurs/Test)

C'est du très bon travail technique pour un prototype statique. Quelques points positifs qui sautent aux yeux :

## Ce qui est solide

- **Séparation données/code** : tout le catalogue vit dans du JSON (marques, produits, préparateurs, véhicules), donc tu pourras brancher un vrai back-office plus tard sans réécrire le front. C'est la bonne approche.
- **Le levier de marge centralisé** (`marginPercent` dans `pricing-config.json`) qui recalcule tous les prix affichés : c'est exactement le genre de détail qui évite un vrai casse-tête plus tard.
- **Sécurité prise au sérieux pour un prototype** : échappement HTML correctement fait (pas le piège classique `textContent`/`innerHTML`), CSP stricte sans inline, validation des données `localStorage` avant usage, RGPD pensé (effacement des données, nettoyage à la déconnexion). Beaucoup de prototypes "vibe codés" sautent complètement cette étape — toi non, c'est un vrai plus.
- **Le sélecteur de véhicule avec badge de compatibilité** répond à un vrai problème (acheter la mauvaise pièce pour son modèle), et c'est un argument de vente concret face aux gros généralistes.
- Tu as repris exactement la bonne structure de l'idée qu'on avait discutée : catégories de préparation + annuaire de préparateurs + produits de nettoyage au même endroit.

## Ce qui m'inquiète, en revenant à la stratégie

Le prototype couvre déjà la **boutique complète** (panier, tunnel de commande, compte) — c'est-à-dire la partie qui demande du stock ou des accords fournisseurs et qui oppose directement aux gros acteurs déjà installés. Le README le confirme lui-même : "aucun prestataire de paiement réel", "catalogue produits complet et réel... restant à construire". Autrement dit, la coquille est construite avant d'avoir résolu le problème le plus dur (d'où viennent les produits, avec quelle marge, quelle logistique).

Pendant ce temps, la partie la plus prometteuse — l'**annuaire de préparateurs** — n'a que 4 réseaux fictifs de démo. C'est l'inverse de ce qu'il faudrait faire en premier : mettre l'essentiel du temps sur de vraies fiches préparateurs (même 10-15 pour commencer, avec de vraies infos), du contenu qui amène du trafic, et garder les produits en JSON "façade" jusqu'à avoir soit un accord de dropshipping/affiliation soit un vrai fournisseur.

Attention aussi à un point réglementaire : la catégorie "échappement sport" et tout ce qui touche à la préparation moteur (reprog, FAP...) doit rester strictement dans le cadre homologué si le site vend ou référence ce genre de produits/prestations — c'est un secteur où des vendeurs ont eu des soucis.

## Prochaines étapes recommandées

1. Le code étant déjà bon, garder cette base technique — ne pas la jeter.
2. Avant d'aller plus loin sur le catalogue produit, remplir vraiment `preparateurs.json` avec des préparateurs réels (contact, région) démarchés, et publier l'annuaire seul, sans boutique, pour commencer à générer du trafic et tester si les pros veulent payer une mise en avant.
3. Pour les produits, commencer par de l'affiliation (liens vers des boutiques existantes) plutôt qu'un vrai panier/paiement — ça évite des mois de travail de logistique pour zéro certitude de demande.
4. Une fois du trafic généré et des premiers pros payants, activer le vrai paiement et le vrai catalogue produit.
