# AutoPrep — prototype

Prototype statique pour le site e-commerce de cosmétique et préparation esthétique automobile décrit dans le cahier des charges.

Ce prototype couvre deux briques du cahier des charges :

- **Marques par type de préparation** (§6) : pour chaque catégorie (cosmétique carrosserie, polish/céramique, jantes, kits carrosserie, éclairage, échappement sport, covering/vitres teintées), plusieurs marques avec note, avis clients et une préférence recommandée.
- **Préparateurs partenaires** (§3) : réseaux Shiftech et BR Performance, avec leurs centres par ville, sélectionnables via un menu déroulant, et les avis clients associés.

## Données modifiables

Tout le contenu (marques, catégories, réseaux, centres, avis) est dans deux fichiers JSON, indépendants du code d'affichage :

- `data/brands.json`
- `data/preparateurs.json`

Modifier ces fichiers (ajouter une marque, un centre, un avis, changer une note...) suffit à mettre à jour le site — aucune modification du HTML/CSS/JS n'est nécessaire. C'est une donnée d'exemple destinée à être remplacée/complétée par un import réel depuis le futur back-office (cf. cahier des charges §4.2).

## Lancer le prototype en local

Le chargement des données se fait via `fetch`, ce qui nécessite un serveur HTTP local (ouvrir `index.html` directement dans le navigateur ne fonctionnera pas à cause des restrictions CORS sur `file://`) :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000/index.html
```

## À suivre

- Contenu réel du cahier des charges restant à construire : sélecteur de véhicule, catalogue produits complet, panier/tunnel d'achat, compte client, back-office.
- Des sous-agents dédiés sont disponibles dans `.claude/agents/` (architect, researcher, developer, debugger, tester, reviewer, security, performance, ui-ux) pour la suite du développement.
