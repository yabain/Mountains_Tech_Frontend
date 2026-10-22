# Audit design — MountainsTech

**Date :** 19 octobre 2026  
**Méthode :** skill `design-taste-frontend` (inspecteur Chrome + lint statique), captures à 1440 / 768 / 390 px.  
**Périmètre :** `/` · `/evenements` · `/membres` · `/projets` · `/contact` · `/login`.  
**Back-office :** revue statique du code uniquement (les écrans `/dashboard` sont derrière l'authentification ; aucune capture live).  
**Aucun fichier de l'application n'a été modifié.** Les captures et rapports sont dans `.taste-skill/audit/`.

---

## 1. Verdict

Le site est propre, lisible et navigable, mais il ne ressemble pas encore à **MountainsTech**. C'est un template « tech bleu » : globe spatial, panneau en verre, bandeaux bleus identiques, cartes à ombre, eyebrows en majuscules. Le nom, Bangangté, les personnes et les projets ne sont presque jamais visibles.

Surtout, **les données affichées ne correspondent pas à la base** : la home promet 12+ membres, 25+ projets et 8 hackathons, alors que l'API live contient 1 membre, 0 projet et 0 partenaire. Les logos partenaires sont tous le même fichier, et la carte membre n'affiche ni nom ni rôle.

Le travail le plus rentable n'est donc pas d'ajouter des effets. Il est de **remplacer le hero, brancher les vraies données et composer les pages autour d'elles**.

### Ce qui fonctionne déjà

- Navigation claire, états actifs, fil d'Ariane, menu mobile.
- Palette navy / bleu / jaune cohérente avec le logo.
- Structure responsive sans débordement horizontal visible.
- La photo de connexion est réelle, pertinente et bien cadrée.
- Le shell admin est solide : sidebar repliable, groupes, compteurs, profil, permissions.
- Les composants `app-alert` et les tokens `--adm-*` sont une bonne base de système.
- Le loader SVG est joli… mais il n'est utilisé nulle part (voir § 9).

---

## 2. Critique — ROUND 1

```text
ROUND 1
Vu en une seconde : un globe terrestre bleu et une carte en verre avec un slogan anglais.
Idée : un consortium tech bleu générique, sans lien sensible avec les montagnes,
Bangangté ou les personnes qui font la communauté.
Live thing : s'inscrire à un événement, découvrir un membre, s'abonner — mais
1 événement, 1 membre sans nom et 0 projet : la promesse n'est pas tenue.

Mots de layout par section :
hero=globe+glass / about=split / members=grid / activities=grid /
projects=grid / hackathons=grid / partners=marquee / newsletter=glass split / footer=columns.
→ quatre grilles de cartes identiques à la suite.

Scores : design 5.5 · usability 6.0 · creativity 4.5 · content 4.0 → overall 5.3
Caps appliqués :
- FAIL inspecteur restants → overall ≤ 6.0
- placeholders (logos, données, "À compléter") → content ≤ 5
- moins de 4 photos réelles sur les pages intérieures → design ≤ 6.5
- page quasi immobile (still-page) → design ≤ 7
- eyebrows / gradients / ombres / hairlines → overall ≤ 6.5
```

### Les trois problèmes les plus visibles

1. **Le premier écran ne parle pas du sujet.**
   `home/desktop-fold.jpg` et `desktop-film-01.jpg` : globe spatial stock + panneau en verre + titre en anglais. On pourrait remplacer « MountainsTech » par n'importe quelle autre marque tech sans que l'image change. Les héros d'Événements, Membres et Projets sont le même bandeau bleu à cercles concentriques (`events/desktop-fold.jpg`, `members/desktop-fold.jpg`, `projects/desktop-fold.jpg`).
   **Fix :** un seul hero spécifique au sujet — photo réelle du technopôle / de l'équipe / d'un hackathon, ou un parti pris typographique fort autour de « sommet / réseau / Bangangté ». En français. Un CTA principal. Pas de verre, pas de dégradé.

2. **Le site affiche des placeholders et se contredit.**
   `home/desktop-page-01.jpg` et `desktop-page-02.jpg` : les cartes « membres » et « activités » affichent des logos MOUNTAINS géants, recadrés ; les 8 partenaires sont tous le même logo. `members/desktop-fold.jpg` : une carte vide avec « APPROVED ». `projects/desktop-fold.jpg` : « 0 projet » et une page vide. `events/desktop-fold.jpg` : 1 carte pour une grille de 3 colonnes.
   **Fix :** une seule source de vérité (API ou JSON assumé), de vrais logos et de vraies photos, des états vides conçus, et un mapping correct des données membres (`companyName` → nom affiché, `APPROVED` → « Approuvé »).

3. **La composition et l'échelle typographique s'effondrent sur les pages intérieures.**
   Une carte de 335 px dans une grille de 3 colonnes laisse 900 px de vide ; la page Projets est un champ vide avec une recherche. Le corps de texte des événements est à **11,5 px**, celui du contact à **14 px**, avec 8 à 14 tailles différentes par page. Quatre sections de la home répètent le même motif : eyebrow + H2 centré + grille + deux boutons.
   **Fix :** un vrai gabarit éditorial par page (un élément vedette + une liste, pas une grille vide), un corps de texte à 16 px, une échelle de 5 tailles, et la suppression des eyebrows / ombres / grilles décoratives.

---

## 3. Constats détaillés

### 3.1 Idée, hero et hiérarchie — majeur

- Le hero de la home utilise une image de globe spatial **sans rapport avec le Cameroun, les montagnes ou la communauté**. Le panneau `hero__panel` est en glassmorphism sur cette image.
- Le titre, le sous-titre et le paragraphe sont **en anglais**, alors que les CTA et tout le reste du site sont en français : `src/assets/data/site.json`, lignes 4-7.
- Tous les héros intérieurs sont identiques : bande navy, cercles concentriques, H1 centré, sous-titre, fil d'Ariane. Aucune page n'a de visuel ou de composition propre.
- Les H1 mesurés font 46 à 61 px (3,2 à 4,2 vw) ; l'inspecteur ne trouve **aucun élément dominant** sur la plupart des premiers écrans. Le globe est décoratif, pas informatif.
- Le hero mobile fait trois lignes avec le titre anglais ; le panneau de verre occupe tout le premier écran.

**Direction à explorer (pas à appliquer ici) :** partir du sujet réel. MountainsTech est un technopôle à Bangangté, lancé lors d'un hackathon, avec des jeunes, des projets et un territoire. Un hero avec une **photo réelle de l'équipe ou du lieu**, un très grand titre en français, et une seule action (« Découvrir l'écosystème ») ferait plus pour l'identité que tous les dégradés.

### 3.2 Contenu et données — bloquant

| Constat | Preuve | Impact |
|---|---|---|
| La home est statique et contredit l'API | `site-data.service.ts` charge `/assets/data/site.json` ; la home affiche 12+ membres / 25+ projets / 8 hackathons ; `/api/v1/public/members` renvoie 1 membre, `/public/home` 0 partenaire | Perte de confiance immédiate |
| Les logos sont des placeholders | Les 8 partenaires de `site.json` pointent tous vers `/logoMountainsTech/logoNavBar.png` (lignes 110-117) ; activités, projets et hackathons utilisent aussi ce logo comme image | Effet « MOUNTAINS » géant, illisible |
| Les cartes membres sont vides | L'API renvoie `companyName`, `logoUrl`, `sectors` ; l'UI attend `name`, `email`, `role`, `status` (`member-list.component.html`, lignes 28-41) ; le statut brut `APPROVED` n'est pas traduit (`statusLabel`) | La carte n'a ni nom ni rôle, seulement « APPROVED » |
| L'image de l'événement est hotlinkée | `coverUrl` = URL Shutterstock ; sur desktop la capture montre le fallback dégradé, sur mobile la photo stock | Image non maîtrisée, droits, échec de chargement |
| Le temps de l'événement se contredit | La carte affiche 16:30 ; la description dit « 14h30 (heure de Paris) » | Doute sur l'horaire réel |
| Fautes de marque | « Les membres du **MountainTech** » (`member-list.component.html`, ligne 3), « portées par **MountainTech** » sur Projets, « Se **Connecter** » | Incohérence de marque |
| Mélange français / anglais | Hero et à-propos en anglais, CTA en français, statut « APPROVED », footer « Uniting Cameroonian Forces… » | Le site ne sait pas à qui il parle |
| Données « À compléter » | `site.json`, lignes 52-54 (`officeMembers`) | Placeholder dans le contenu source |

**À trancher :** soit la home est **éditoriale** (contenu JSON assumé, compteurs mis à jour manuellement), soit elle est **branchée à l'API**. Aujourd'hui elle mélange les deux et se contredit. Dans les deux cas, les cartes doivent afficher les vrais noms, rôles et images.

### 3.3 Composition et layouts — majeur

- **Événements :** une seule carte (335 px) dans une grille de 3 colonnes ; 900 px de vide à droite. La recherche et le compteur « 1 événement à découvrir » occupent plus de place que le contenu.
- **Projets :** 0 projet, mais une barre de recherche et un compteur « 0 projet » ; le message vide est perdu au milieu d'un grand vide. La page n'offre aucune action.
- **Membres :** 1 carte, puis un vide de 400 px ; la carte elle-même est vide.
- **Accueil :** quatre sections consécutives avec le même motif (Membres, Activités, Projets, Hackathons) ; chaque section a deux boutons « Voir plus » et « En savoir plus » qui mènent au même endroit. Quatre grilles identiques = le template se voit.
- **Marges :** l'inspecteur mesure 141 px à gauche contre 111 px à droite à 1440 px sur la home ; 16 px contre 32 px sur Membres à 390 px. À corriger (conteneur, gouttière, scrollbar).
- **Newsletter :** panneau en verre de 420 px sur fond sombre, avec champs et labels peu lisibles ; il concurrence le footer et ajoute un troisième niveau de surface.
- **Footer :** correct, mais le dégradé radial et la carte du monde sont décoratifs ; les titres de colonnes sont soulignés par un trait cyan.

**Fix :** pour les pages à contenu faible, un **layout vedette** (grande carte à gauche + liste à droite) plutôt qu'une grille à 3 colonnes. Pour la home, alterner les compositions (pleine largeur, split, liste, citation) et supprimer les CTA dupliqués.

### 3.4 Typographie et accessibilité — majeur

- **Corps de texte :** 11,5 px sur Événements (mesuré), 14 px sur Contact, 12 px sur les labels de métriques admin. La règle est 16-20 px pour le texte courant.
- **Échelle :** 8 à 14 tailles par page (10, 11, 12, 13, 14, 15, 16, 20, 22, 30, 61 sur Membres). Il en faudrait environ cinq.
- **Police :** Roboto partout, y compris dans l'admin. C'est la police par défaut de l'écosystème ; rien ne signe la marque.
- **Contraste login :** « Se connecter » = **2,9:1** (blanc sur `#08a3df`) ; « Mot de passe oublié ? » = **3,6:1**. WCAG AA demande 4,5:1.
- **Contact :** les labels existent mais sont `mv-visually-hidden` ; visuellement, seuls les placeholders portent l'information. Dès qu'on tape, le champ n'a plus de libellé visible.
- **Titres invisibles au chargement :** sur Accueil, Événements, Membres et Contact, le H1 est à **0 % d'opacité 1,2 s après le chargement** (animation `page-enter`). Sur un appareil lent, le premier écran semble vide.
- **`100vh` :** 17 occurrences (lint) ; hauteur qui saute sur mobile. Utiliser `100svh` / `100dvh`.
- **Focus :** les tokens `--color-focus-ring` sont cassés (voir § 3.6) et la valeur `2px solid #00447e offset 2px` n'est pas une syntaxe valide. Les états clavier ne sont pas fiables.
- **Petites capitales :** 20 eyebrows en majuscules espacées, souvent à 10-11 px.

**Fix :** corps 16 px, échelle display / heading / lead / body / small ; labels visibles ; contraste ≥ 4,5:1 ; H1 peint dès le premier frame ; `focus-visible` explicite ; `prefers-reduced-motion`.

### 3.5 Couleur, surfaces et « tells » de template — majeur

Le lint statique sur **220 fichiers** relève **214 FAIL** et **131 WARN**. Les cinq familles dominantes :

| Tell | Occurrences | Exemple |
|---|---:|---|
| `box-shadow` sur des éléments au repos | 89 | cartes, boutons, search-box, login |
| `hairline` / traits décoratifs | 52 | header, footer, séparateurs de cartes |
| `gradient` | 48 | héros, fallbacks, footer, cartes |
| `eyebrow` / micro-label au-dessus d'un titre | 20 | « Membres », « Activités », « Projets », « À l'affiche » |
| `emoji` | 5 | 🏆, ★, ♧, ✓ |
| `outlined-box` (WARN) | 100 | bordures 1 px autour de cartes |
| `glass` (WARN) | 7 | hero, newsletter, footer |

- Le fond « papier millimétré » (`linear-gradient` répété) est présent sur toutes les pages intérieures. Il ajoute du bruit et rend les vides plus visibles.
- Le bleu est partout : `#00447e`, `#0052cc`, `#08a3df`, `#18cbff`, `#17a6df`, `#07536a`, `#039ee1`. Le jaune `#ffe721` n'apparaît presque jamais alors qu'il est la couleur secondaire de la marque.
- Les boutons alternent bleu plein, bleu clair, blanc avec ombre. L'accent n'est donc plus un accent.
- Les ombres, les dégradés et les bordures 1 px sont exactement les signaux qui font lire une page comme « générée ».

**Fix :** surfaces plates, séparation par ton ou par espace ; un seul accent (le jaune) réservé à l'action principale et à un détail de données ; suppression des eyebrows, hairlines décoratives, ombres au repos et dégradés (sauf scrim sur photo).

### 3.6 Système de design — à réparer

- **Deux systèmes cohabitent :** le public utilise `--color-*` + Bootstrap + Roboto ; l'admin utilise `--adm-*` + oklch + composants custom. Les rayons, ombres et tailles divergent.
- **Tokens cassés dans `src/styles.scss` :** 41 déclarations se terminent par un point au lieu d'un point-virgule (lignes 87-91, 112-146). En CSS, `--color-info-50: #e3f8fb.` avale les déclarations suivantes : `--color-info-100`, `--color-info-light` et `--color-focus-ring` ne sont **pas définis**. Le bloc `.dark` est largement inopérant.
- `--color-focus-ring: 2px solid #00447e offset 2px.` est de toute façon une syntaxe invalide (`offset` n'existe pas dans ce shorthand).
- **Deux loaders :** `app-loading-spinner` (le nouveau SVG) n'est importé/utilisé nulle part ; l'admin affiche « Chargement des données... » et un `.res-spinner`. Le SVG utilise `#00FFFF` et `#ff0`, hors charte, et sera quasi invisible sur les cartes blanches de l'admin (cyan sur blanc ≈ 1,3:1).
- **Deux messages de bienvenue :** le dashboard affiche déjà « Bienvenue {nom} ! » dans `.dashboard-welcome`, et le nouvel `app-alert` ajoute « Bienvenue, {nom} ! » en bas à droite. Au premier chargement, l'utilisateur est accueilli deux fois.

### 3.7 Imagerie et motion — majeur

- Pages intérieures : **1 photo réelle** sur Contact, 1 sur Membres, 1 sur Projets, 2 sur Événements. La référence en demande 4 à 12. La home a beaucoup d'images, mais ce sont surtout des logos et des placeholders.
- Les ratios d'image ne sont pas unifiés : logos `cover` dans des cartes 320×220, logos partenaires `contain` dans 160×80, photo d'événement en 16:9, photo du à-propos en 16:9.
- **Motion :** seuls 1 à 2 éléments bougent ; c'est un fade d'entrée. L'inspecteur classe toutes les pages en `still-page`. Le lien Facebook avec aperçu photo est un bon point de départ mais reste une image statique.
- **Fix :** une photo par section qui a un sujet (équipe, lieu, événement, projet), un grade commun ; une signature de mouvement (tracé de montagne, parallaxe légère, révélation des chiffres) et un fallback `prefers-reduced-motion`.

---

## 4. Page par page

| Page | Ce qui marche | Ce qui casse | Priorité |
|---|---|---|---|
| **Accueil** | Navigation, palette, logo, structure | Hero stock + anglais, 4 grilles identiques, logos géants, stats contredites, newsletter en verre | 1 |
| **Événements** | Carte lisible, recherche, compteur | 1 carte dans 3 colonnes, 900 px de vide, corps 11,5 px, image stock hotlinkée, horaire contradictoire | 1 |
| **Membres** | Recherche, carte, lien profil | Carte sans nom ni rôle, « APPROVED », « MountainTech », 1 seul membre, vide | 1 |
| **Projets** | Fil d'Ariane, recherche | 0 projet, aucun état vide utile, page vide | 2 |
| **Contact** | Layout 2 colonnes, photo/identité, formulaire | Corps 14 px, labels masqués, titre dupliqué dans la carte, formulaire sous la carte info sur mobile | 2 |
| **Login** | Photo réelle, carte centrée, formulaire simple | Bouton 2,9:1, lien 3,6:1, ombre lourde, titre 29 px | 2 |
| **Admin** | Shell, sidebar, permissions, compteurs | Sidebar sombre sur canvas clair, 5 tuiles KPI à icônes, double bienvenue, ombres/dégradés, 10 px | 2 |

---

## 5. Back-office — revue statique

Je n'ai pas pu capturer `/dashboard` : l'accès est protégé et je n'ai pas de compte de test. La revue ci-dessous porte sur le code.

- **Sidebar sombre `#102c43` sur canvas clair `oklch(0.9754 …)`** : dans l'étude de référence, **0 écran sur 17** n'utilise une sidebar sombre saturée sur un canvas clair. C'est le signal « dashboard template » le plus fort.
- **5 tuiles KPI**, chacune avec une icône dans un carré teinté (bleu/rouge) : exactement le motif que la référence interdit. Les KPI devraient être de la **typographie** (chiffres nus, unités en gris), pas des tuiles à icônes.
- **Double bienvenue** : `.dashboard-welcome` + `app-alert` (voir § 3.6).
- **Ombres au repos** : sidebar, welcome, 5 métriques, cartes d'activité, bouton segmenté. **Dégradés** : welcome (`linear-gradient(110deg, #f4f9fd, #fff 72%)`), motif répété ligne 219.
- **Labels 10 px en majuscules** pour les groupes de navigation, **12 px** pour les libellés de métriques.
- **La première question du dashboard n'est pas répondue** : « que dois-je traiter aujourd'hui ? ». Les messages non lus et les candidatures en attente sont noyés parmi cinq compteurs de même poids.
- **Points forts :** sidebar repliable, groupes, compteurs, profil, responsive, navigation par permission. La base est bonne ; c'est l'habillage et la hiérarchie qui restent à décider.

**Fix admin :** sidebar sur le même fond que le canvas avec une règle 1 px ; une bande KPI typographique ; un bloc « À traiter » en premier ; suppression des ombres et du dégradé de bienvenue ; un seul message d'accueil.

---

## 6. Les trois changements à plus fort impact

1. **Remplacer le hero et l'identité générique par un hero spécifique à MountainsTech.**
   Une photo réelle (équipe, technopôle, hackathon) ou un parti pris typographique fort, en français, avec un seul CTA. Supprimer le globe, le panneau en verre et le dégradé. Décliner ensuite ce principe par page (Événements = date/programme, Membres = visages, Projets = captures produit).

2. **Rendre les données vraies et les layouts résilients.**
   Brancher la home sur l'API ou assumer un contenu éditorial cohérent ; remplacer les logos placeholder par de vrais assets ; afficher nom/rôle/statut correctement ; remplacer l'image Shutterstock par une image possédée ; concevoir les états 0/1 élément (événement vedette, page vide avec CTA) au lieu d'une grille vide.

3. **Poser un système typographique et de surfaces discipliné.**
   Corps 16 px, cinq tailles, un seul accent jaune, surfaces plates, suppression des 20 eyebrows / 89 ombres / 52 hairlines / 48 dégradés. H1 visible dès le premier frame, contrastes ≥ 4,5:1, focus visible, labels de formulaire visibles.

---

## 7. Plan d'action proposé

### Semaine 1 — corrections rapides (sans refonte)
- Réparer les 41 points-virgules de `styles.scss` et la valeur `--color-focus-ring`.
- Rendre le H1 visible immédiatement (supprimer l'opacité 0 de `page-enter`).
- Passer le corps de texte à 16 px sur Événements et Contact.
- Corriger le contraste du bouton login et du lien « Mot de passe oublié ? ».
- Afficher des labels visibles sur le formulaire de contact.
- Mapper `companyName` → nom affiché et `APPROVED` → « Approuvé » sur la carte membre.
- Corriger « MountainTech » → « MountainsTech » et « Se Connecter » → « Se connecter ».
- Supprimer le doublon de bienvenue admin.

### Semaine 2 — contenu et états
- Remplacer tous les `logoNavBar.png` utilisés comme image de carte par de vraies photos/logos.
- Remplacer l'image Shutterstock par une image locale.
- Décider du statut de la home (API ou éditorial) et aligner les compteurs.
- Concevoir les états vides d'Événements, Membres et Projets avec une action.
- Corriger l'horaire de l'événement et les incohérences de langue.

### Semaine 3 — direction visuelle
- Hero spécifique + déclinaison par page.
- Photos réelles, un grade commun, ratios unifiés.
- Suppression des eyebrows, ombres, hairlines, dégradés décoratifs et du fond quadrillé.
- Une signature de mouvement + `prefers-reduced-motion`.

### Ensuite — admin et système
- Sidebar claire, KPI typographiques, bloc « À traiter ».
- Unifier les tokens public/admin.
- Décider du loader : l'intégrer (avec des couleurs de la charte et un contraste correct) ou le retirer.

---

## 8. Mesures de référence

| Page | FAIL | WARN | Corps | Tailles | Images | H1 |
|---|---:|---:|---:|---:|---:|---|
| Accueil | 9 | 6 | 16 px | 14 | 35 (dont logos) | 46,1 px / 3,2 vw |
| Événements | 11 | 6 | **11,5 px** | 10 | 6 | 48 px / 3,3 vw |
| Membres | 9 | 8 | — | 10 | 5 | 60,8 px / 4,2 vw |
| Projets | 8 | 5 | — | 8 | 5 | 60,8 px / 4,2 vw |
| Contact | 10 | 4 | 14 px | 8 | 5 | 60,8 px / 4,2 vw |
| Login | 4 | 6 | — | 3 | 1 | 28,8 px / 2 vw |

**Lint global :** 220 fichiers · 214 FAIL · 131 WARN.  
**Captures :** `.taste-skill/audit/{home,events,members,projects,contact,login}/`  
**Rapports JSON :** `report.json` dans chaque dossier.

---

## 9. Note sur le loader SVG

Le composant `loading-spinner` a été remplacé par l'animation SVG, mais :

- il n'est utilisé **nulle part** dans l'application (`app-loading-spinner` n'apparaît que dans sa propre définition) ;
- ses couleurs `#00FFFF` et `#ff0` ne font pas partie de la charte (`--color-primary` / `--color-secondary`) ;
- sur les cartes blanches de l'admin, le cyan et le jaune sont quasi invisibles (contraste ≈ 1,3:1 et 1,1:1) ;
- l'admin continue d'afficher « Chargement… » en texte et un `.res-spinner`.

**Décision à prendre :** soit l'intégrer dans `LoadingStateComponent` et les états de chargement admin avec des couleurs accessibles (bleu `#00447e` / jaune `#ffe721` sur fond clair, ou variante dark), soit le retirer pour éviter du code mort.
