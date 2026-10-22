# Prototype — Le rapport d’ascension

Maquette autonome de la home MountainsTech, dans la direction **« Le rapport d’ascension »** (rapport annuel éditorial, ancré à Bangangté). Elle vit ici, en dehors de l’application : **aucun fichier de `src/` n’a été touché pour la construire.**

## Lancer le prototype

```powershell
node .taste-skill/prototype/serve.mjs
# http://127.0.0.1:4173/
```

Ou ouvrir directement `.taste-skill/prototype/index.html` (les chemins sont relatifs). Aucun build, aucune dépendance, aucun framework : HTML, CSS, un fichier JS, les vraies photos et les vrais logos copiés dans `assets/`.

## Direction

- **Terrain :** papier `#F3F5F2`, encre `#0E1F2B`, bleu `#00447E`, bleu clair `#D9E8F2`, jaune `#FFE721`.
- **Typographie :** Bodoni Moda 500 (display) + Jost 400/500 (texte), auto-hébergées.
- **Grille :** 12 colonnes, axe de lecture fixe à 42 % ; aplats de couleur, rayon 0, aucune ombre, aucun verre, aucun dégradé.
- **Motif signature :** le dessin de courbes de niveau (relief), répété dans le hero, le manifeste, les chiffres, l’appel final et le pied de page, comme fil conducteur.
- **Une seule chose vivante :** la carte du réseau (8 organisations réelles, survol/focus/clic, légende), avec le mur de partenaires comme repli sans JS.
- **Section projets :** un état vide honnête (invitation), pas une fausse étude de cas.
- **Photographies :** alternance des photos dans la marge (gauche/droite) pour tenir les deux bords sans casser l’axe.

## État vérifié

- **Lint statique :** 4 fichiers, **0 FAIL, 0 WARN** (`node .agents/skills/design-taste-frontend/scripts/lint.mjs .taste-skill/prototype`).
- **Inspecteur Chrome 1440 / 768 / 390 :** **0 FAIL**, 1 WARN assumé (`no-footage`).
- Passé sans échec : débordement horizontal, étiquettes « eyebrow », titres à plus de 2 lignes, trous blancs, sections déséquilibrées, contraste, nombre de tailles de police (9 : 14 / 15 / 16 / 17 / 20 / 36 / 65 / 120, et le display du hero à 51 sur téléphone).
- Le WARN `no-footage` est **défendu** : aucun clip honnête n’existe dans les assets ; une banque d’images serait du remplissage, pas du contenu.

## Captures

`.taste-skill/prototype-inspect/` : Pli et pages desktop, tablette et mobile, plus le rapport JSON complet.

## Réserves de contenu (à trancher avant intégration)

1. **Chiffres** `500` talents et `12` entreprises : issus de `src/assets/data/site.json`, non recoupés avec la base live.
2. **Événement** « L’Intelligence Artificielle au Service de la Création Culinaire » du **15 octobre 2026** : déjà passé au 19 octobre 2026. À remplacer par le prochain rendez-vous réel.
3. **Rôles** de DigiKuntz, SDK Games Africa et TechnoPark MeMe : formulations déduites, à valider.
4. **Lien événement** : pointe vers `http://localhost:4200/events` ; à remplacer par la route réelle en production.
5. **Capture Zoom** `IMG-20260712-WA0012.jpg` : volontairement non utilisée.

## Suite

Intégration dans Angular après validation : composants, `site.json`, assets réels, puis re-audit live de l’admin (nécessite des identifiants de test). Les correctifs rapides de l’audit (déclarations CSS cassées dans `styles.scss`, H1 masqués, contraste du login, libellés « MountainTech ») restent eux aussi en attente d’accord.
