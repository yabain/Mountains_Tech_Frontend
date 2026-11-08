# MountainsTech

Application web de **Mountains Tech In Africa**, une association à but non lucratif fondée à Bangangté, au Cameroun. Elle rassemble des acteurs du numérique autour de la coopération, de l’innovation et du développement de l’économie numérique.

Le projet comprend un site public et un espace d’administration connecté à une API.

## Fonctionnalités

### Site public

- Présentation de l’association, de ses membres et de ses partenaires
- Consultation des activités, événements, projets et hackathons
- Inscription aux événements et aux hackathons
- Formulaire de demande d’adhésion
- Contact et abonnement à la newsletter
- Pages légales

### Administration

Espace sécurisé pour gérer notamment les membres, les demandes d’adhésion, les contacts, les événements, les activités, les projets, les hackathons, les partenaires et les utilisateurs. Les accès dépendent des permissions du compte.

## Technologies

- Angular 19 et TypeScript
- SCSS et Bootstrap 5
- Angular Router, Reactive Forms et RxJS
- Rendu côté serveur (SSR), hydratation et prérendu
- API REST pour les données et les opérations d’administration

## Prérequis

- Node.js compatible avec Angular 19
- npm
- L’API backend pour les fonctionnalités qui nécessitent des données distantes

## Installation et lancement

```bash
git clone https://github.com/lioneleinsten/MountainsTechSoutenance.git
cd MountainsTechSoutenance
npm ci
npm start
```

Le serveur de développement Angular est ensuite accessible à l’adresse indiquée dans le terminal (généralement `http://localhost:4200`).

## Configuration de l’API

L’adresse de l’API est définie dans les fichiers d’environnement :

- Développement : `http://localhost:3000/api/v1`
- Production : `https://mt.yaba-in.com/api/v1`

Pour utiliser l’application en local avec toutes ses fonctionnalités, lancez le backend correspondant ou adaptez l’URL dans `src/environments/environment.ts`. Les pages d’administration nécessitent un compte autorisé.

## Commandes utiles

```bash
npm start       # Lance le serveur de développement
npm run build   # Construit l’application
npm test        # Lance les tests
```

La configuration de production est utilisée par défaut pour `npm run build`. Les fichiers générés sont placés dans `dist/mountains-tech`.

## Structure du projet

```text
src/
├── app/
│   ├── core/       # Services, modèles, authentification et HTTP
│   ├── features/   # Pages publiques et fonctionnalités d’administration
│   ├── layouts/    # Gabarits public et administration
│   └── shared/     # Composants partagés
├── assets/         # Ressources et données du site
└── environments/   # Configuration des environnements
```

## Licence

Aucune licence n’est actuellement spécifiée dans ce dépôt.
