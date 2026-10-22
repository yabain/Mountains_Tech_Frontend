# Descriptions détaillées des cas d'utilisation — Mountains Tech (Frontend)

Référence : diagramme global `01-cas-utilisation-global.puml`.
Convention : **PN** = scénario principal (nominal), **ALT** = alternatif, **EXC** = exception.

---

## UC01 — S'authentifier (backoffice)

| Élément | Contenu |
|---|---|
| **Acteur principal** | Administrateur (SUPER_ADMIN, ADMIN, EDITOR, COMMUNICATION) |
| **Acteurs secondaires** | API `/api/v1/auth/login`, base MongoDB |
| **Préconditions** | L'utilisateur possède un compte actif ; il n'est pas déjà connecté. |
| **Déclencheur** | L'utilisateur accède à `/dashboard` sans session valide, ou choisit « Se connecter ». |
| **Postconditions** | Session ouverte, JWT stockage, redirection vers `/dashboard` **limité aux permissions du rôle** (sinon échec : pas de session). |

**PN — scénario nominal**
1. Le système affiche le formulaire (email + mot de passe), sans « carte », en validant en temps réel (Reactive Forms : requis, format email, min 8 caractères).
2. L'utilisateur saisit ses identifiants ; le bouton reste désactivé tant que le formulaire est invalide (**anti double-submit**).
3. Le frontend envoie `POST /api/v1/auth/login`.
4. Le backend vérifie l'identifiant et compare le hash du mot de passe.
5. Réponse `200 { accessToken, refreshToken, user }`.
6. `AuthService` stocke le token (`access_token`) et le profil (`auth_user`).
7. Redirection vers `/dashboard` ; `AdminGuard` vérifie le rôle, `AdminPermissionGuard` filtre les routes.
8. La barre latérale n'affiche que les modules autorisés au rôle.

**ALT 1 — formulaire invalide** : aucune requête n'est émise ; les messages d'erreur s'affichent sous les champs.
**EXC 1 — identifiants invalides** : `401 UNAUTHORIZED` → message « Email ou mot de passe incorrect », bouton réarmé.
**EXC 2 — rôle sans accès dashboard** : connexion acceptée mais redirection vers `/` (site public).
**EXC 3 — token expiré sur une page protégée** : intercepteur `401` → purge du stockage → redirection `/login`.
**EXC 4 — 429 (trop de tentatives)** : message « Trop de tentatives, réessayez plus tard ».

---

## UC02 — Soumettre une candidature d'adhésion (entreprise)

| Élément | Contenu |
|---|---|
| **Acteur principal** | Entreprise (visiteur extérieur) |
| **Acteurs secondaires** | API `POST /api/v1/public/members/applications`, administrateur (réception) |
| **Préconditions** | L'entreprise n'a pas déjà de demande en cours ; le formulaire est accessible publiquement (`/devenir-membre`). |
| **Déclencheur** | L'utilisateur clique « Devenir membre ». |
| **Postconditions** | Une demande `PENDING` est enregistrée ; l'entreprise reçoit un écran de confirmation ; la demande est visible dans le backoffice. |

**PN — scénario nominal**
1. Ouverture du formulaire en 6 étapes (identité de l'entreprise → coordonnées → représentant → consentement → récapitulatif → confirmation).
2. L'utilisateur remplit chaque étape ; la validation de l'étape bloque la suite en cas d'erreur (message affiché).
3. Étape 5 : **récapitulatif complet** des données saisies (dont secteurs obligatoires vérifiés).
4. L'utilisateur confirme ; le bouton est désactivé (`submitting = true`).
5. `POST /api/v1/public/members/applications` avec `consent: true`.
6. Réponse `201 { applicationId, status: PENDING }`, message « Demande soumise pour validation ».
7. Écran de confirmation « demande reçue + prochaines étapes ».

**ALT 1 — logo** : champ URL du logo (pas d'upload côté public actuellement).
**ALT 2 — abandon en cours de route** : aucune donnée n'est envoyée tant que l'étape finale n'est pas confirmée.
**EXC 1 — 400 VALIDATION_ERROR** : `errors[]` est mappé sur les champs concernés (messages explicites).
**EXC 2 — 409 CONFLICT** : « Une demande de votre entreprise existe déjà ».
**EXC 3 — 429 / 500** : messages dédiés + possibilité de réessayer (le flag `submitting` est réarmé).

---

## UC03 — S'inscrire avec son équipe à un hackathon

| Élément | Contenu |
|---|---|
| **Acteur principal** | Chef d'équipe (participant) |
| **Acteurs secondaires** | API `POST /api/v1/public/hackathons/:id/teams`, administrateur (validation) |
| **Préconditions** | Le hackathon est ouvert aux inscriptions ; l'équipe n'est pas déjà inscrite. |
| **Déclencheur** | Choix d'un hackathon puis « S'inscrire ». |

**PN**
1. Affichage des informations du hackathon (dates, règles, stack).
2. Saisie : nom d'équipe, école/organisation, chef de prénom/nom/email/téléphone.
3. Ajout des membres (prénom, nom, email, rôle) — taille d'équipe bornée.
4. Idée de projet, technologies, consentement.
5. Récapitulatif + confirmation, bouton désactivé à l'envoi.
6. `POST .../teams` → `201 { teamId, status: PENDING }` ; reçu affiché avec le statut.

**ALT 1** — équipe trop petite/grande : message d'erreur avant envoi (`validateMembers()`).
**EXC 1** — email invalide du chef ou d'un membre : `400 VALIDATION_ERROR` mappé.
**EXC 2** — inscriptions clôturées : `409/422` → message « Inscriptions fermées ».
**EXC 3** — échec réseau : réarmement du bouton + message.

---

## UC04 — Envoyer un message de contact

| Élément | Contenu |
|---|---|
| **Acteur principal** | Visiteur |
| **Acteurs secondaires** | API `POST /api/v1/public/contact` |
| **Préconditions** | Page `/contact` accessible. |
| **Déclencheur** | Remplissage + envoi du formulaire. |

**PN**
1. Formulaire : nom, email, sujet, message, consentement.
2. Validation côté client (requis + format email) avec messages sous les champs ; bouton désactivé si incomplet ou déjà en cours d'envoi (`sending`).
3. Envoi → `201 { messageId }`, message « Votre message a été transmis ».
4. Écran de succès + toast de retour d'état.

**EXC 1 — 422** : détails par champ.
**EXC 2 — 429** : rate-limiting → « Trop de messages, réessayez plus tard ».
**EXC 3 — 500** : message global + reprise possible.

---

## UC05 — S'inscrire à la newsletter

| Élément | Contenu |
|---|---|
| **Acteur principal** | Visiteur (formulaire pied de page et page `/newsletter`) |
| **Acteurs secondaires** | API `POST /api/v1/public/newsletter/subscriptions` |
| **Préconditions** | L'adresse n'est pas déjà abonnée (ou est désabonnée). |
| **Déclencheur** | Saisie de l'email (+ prénom) et validation du consentement. |

**PN**
1. L'utilisateur saisit son email et coche le consentement.
2. Validation (format email, consentement obligatoire) + anti double-submit.
3. `POST .../subscriptions { email, firstName, consent }` → `200 { status: SUBSCRIBED }`.
4. Message « Inscription confirmée ».

**EXC 1 — email invalide** : message inline, pas d'appel API.
**EXC 2 — déjà abonné (409)** : message informatif « Vous êtes déjà inscrit ».
**EXC 3 — 429** : message d'attente.

---

## UC06 — Valider (ou rejeter) une candidature de membre — administrateur

| Élément | Contenu |
|---|---|
| **Acteur principal** | Administrateur (droit `members`) |
| **Acteurs secondaires** | API `PATCH /api/v1/admin/members/:id/status`, site public |
| **Préconditions** | Administrateur authentifié avec la permission `members` ; des demandes existent. |
| **Déclencheur** | Sélection d'un statut dans `/dashboard/members` ou `/dashboard/members/applications`. |

**PN**
1. Ouverture de la liste (recherche, filtre de statut, pagination serveur `page/limit`).
2. Consultation du détail d'une demande `PENDING`.
3. Choix `APPROVED` (ou `REJECTED` / `SUSPENDED`) ; **confirmation avant l'action sensible**.
4. `PATCH /admin/members/:id/status { status }` → `200`.
5. Toast de succès, ligne et compteurs mis à jour, événement journalisé (audit log).
6. **Répercution** : le site public (`GET /public/members`) reflète le nouveau statut.

**ALT 1** — filtrer par `PENDING` pour traiter la file d'attente.
**EXC 1 — 401/403** : session expirée → `/login` ; droits insuffisants → toast « droits nécessaires » (aucune mutation).
**EXC 2 — 422** : statut invalide → message serveur.
**EXC 3 — erreur réseau** : aucun changement local (rollback optimiste), message d'erreur.

---

## UC07 — Créer, cibler, prévisualiser, envoyer ou programmer une annonce

| Élément | Contenu |
|---|---|
| **Acteur principal** | Administrateur (droit `announcements` : ADMIN, COMMUNICATION) |
| **Acteurs secondaires** | API `/admin/announcements` (+ `/recipients`), worker d'envoi, SMTP |
| **Préconditions** | Permission `announcements` ; au moins une audience cible existante. |
| **Déclencheur** | « Nouvelle annonce » dans `/dashboard/announcements`. |

**PN (création + programmation)**
1. Rédaction de l'objet (max 200) et du contenu dans l'éditeur WYSIWYG (HTML propre, sanitisé DOMPurify à l'aperçu).
2. Insertion de variables (`{{firstName}}`, `{{lastName}}`, `{{email}}`, `{{unsubscribeUrl}}`).
3. Choix de l'audience : `ALL / MEMBERS / NEWSLETTER / EVENT_PARTICIPANTS / HACKATHON_TEAMS / CUSTOM` + filtres (statuts de membres, événements, hackathons, tags, exclusion des désinscrits).
4. Estimation **debouncée** du nombre de destinataires (`POST /:id/recipients`) affichée dans une carte.
5. **Aperçu** : onglets desktop (720 px), mobile (375 px), email (600 px).
6. Choix du mode : **immédiat** ou **programmé** (`datetime-local`, min = maintenant).
7. **Confirmation** « Envoyer/Programmer à N destinataire(s) ? » (avant toute action).
8. Envoi de `POST /admin/announcements { status: SENDING | SCHEDULED }` — **le navigateur ne déclenche jamais l'envoi lui-même**.
9. Toast + mise à jour de l'historique (`DRAFT → SCHEDULED → SENDING → SENT / FAILED / CANCELLED`) avec compteurs `sent/recipientCount`.

**ALT 1 — aperçu seul** : aucun appel d'envoi.
**ALT 2 — annulation d'une programmation** : action confirmée → `CANCELLED`.
**ALT 3 — brouillon** : sauvegarde `DRAFT`, éditable ultérieurement.
**EXC 1 — 401/403** : redirection ou refus selon le rôle.
**EXC 2 — échec d'envoi backend** : statut `FAILED` visible dans l'historique.
**EXC 3 — 429** : limitation de débit sur les appels d'estimation.

---

## UC08 — Gérer les contenus du backoffice (CRUD)

| Élément | Contenu |
|---|---|
| **Acteur principal** | Administrateur (selon rôle : EDITOR → activités/événements/projets/hackathons/médias/paramètres ; COMMUNICATION → annonces/newsletter/contacts/médias/paramètres ; ADMIN/SUPER_ADMIN → tout) |
| **Acteurs secondaires** | API `/api/v1/admin/...`, site public (lecture des contenus publiés) |
| **Préconditions** | Permission sur la ressource concernée. |
| **Déclencheur** | Ouverture d'une page de gestion (`/dashboard/<ressource>`). |

**PN (ex. : un projet)**
1. La liste se charge avec états **loading / empty / error** ; recherche, filtre de statut et pagination serveur.
2. « Créer » → modale ou éditeur (titre, slug, extrait, contenu, couverture, statut).
3. Validation client + **aperçu de l'image** ; envoi `POST` → toast succès + rafraîchissement.
4. « Éditer » → pré-remplissage → `PUT/PATCH`.
5. « Supprimer » → **modale de confirmation explicite** (irréversible) → `DELETE`.
6. Les contenus `PUBLISHED` apparaissent immédiatement sur le site public via l'API.

**ALT 1** — filtre par statut + recherche pour retrouver un enregistrement.
**ALT 2** — upload de média depuis l'éditeur (`POST /admin/media/upload`, type/taille validés).
**EXC 1 — 401/403** : selon le rôle, la route est inaccessible (guard) ou refusée par l'API.
**EXC 2 — 422** : erreurs par champ dans la modale.
**EXC 3 — 404 (ressource supprimée entre-temps)** : toast « ressource introuvable » + retour à la liste.

---

## Synthèse des autres cas d'utilisation (même modèle)

| Réf. | Cas d'utilisation | Acteur principal | Priorité |
|---|---|---|---|
| UC01 | Consulter l'accueil | Visiteur | Haute |
| UC02 | Consulter/filtrer/paginer les listes publiques | Visiteur | Haute |
| UC03 | Consulter le détail d'un contenu (membre/projet/événement/hackathon) | Visiteur | Haute |
| UC04 | S'inscrire à un événement | Visiteur | Moyenne |
| UC05 | Consulter les partenaires / pages légales | Visiteur | Moyenne |
| UC15 | Demander la réinitialisation du mot de passe | Administrateur | Moyenne |
| UC16 | Consulter le tableau de bord | Administrateur | Haute |
| UC18 | Valider/rejeter une équipe de hackathon | Administrateur | Haute |
| UC19 | Gérer les utilisateurs et les rôles | ADMIN/SUPER_ADMIN | Haute |
| UC20 | Gérer les messages de contact | ADMIN/COMMUNICATION | Moyenne |
| UC21 | Gérer les médias | Selon rôle | Moyenne |
| UC22 | Gérer les paramètres (chiffres clés) | ADMIN/SUPER_ADMIN | Haute |
| UC23 | Gérer les abonnés newsletter (import/export CSV) | COMMUNICATION | Moyenne |
| UC25 | Consulter les logs d'audit | SUPER_ADMIN | Basse |
