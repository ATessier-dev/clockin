# Clockin

Clockin est l'outil interne utilisé par le personnel des galeries pour le
pointage, l'horaire, les listes de vérification, la documentation interne
et la génération de contenu pour les réseaux sociaux à partir du catalogue
d'artur.art. C'est une application web interne, pas un produit public.

## Sommaire

- Présentation
- Fonctionnalités
- Rôles et authentification
- Stack technique
- Structure du projet
- Routes API
- Variables d'environnement
- Développement local
- À venir

## Présentation

L'application sert deux publics :

- Les employés, qui pointent leur présence, consultent leur horaire,
  suivent les listes de vérification de leur poste, accèdent à la
  documentation interne et peuvent générer des textes pour les réseaux
  sociaux.
- Les superviseurs, qui gèrent en plus les employés, les horaires, les
  lieux de travail, les postes, les réunions journalières, les événements
  et les paramètres généraux.

L'interface est disponible en français et en anglais, le français étant
la langue par défaut.

## Fonctionnalités

- Pointage : entrée et sortie, avec géolocalisation par plage d'adresses
  IP propre à chaque lieu de travail.
- Horaire : vue hebdomadaire des quarts de travail, assignation par
  employé, poste et lieu de travail, copie d'une semaine complète vers une
  autre.
- Disponibilités : chaque employé indique ses disponibilités par lieu de
  travail et jour de la semaine.
- Feuilles de temps : vue superviseur des présences en cours, des quarts
  planifiés et de l'historique des pointages, avec correction manuelle.
- Liste de vérification : items récurrents (ponctuels, quotidiens,
  hebdomadaires, mensuels) regroupés par catégorie.
- Documentation interne : liens organisés par catégorie, avec description
  optionnelle.
- Réunions journalières et événements : horaire des réunions récurrentes
  et calendrier des événements de la galerie.
- Employés : répertoire, création de comptes, gestion des rôles et des
  postes préférés.
- Publications : génération de textes courts pour les réseaux sociaux à
  partir d'un sujet et de documents de référence, adaptés au média ciblé
  (ton, longueur, registre), avec historique par sujet pour éviter les
  répétitions. Les sujets peuvent être importés automatiquement depuis le
  blogue d'artur.art.
- Recherche par image : identification d'une oeuvre du catalogue
  artur.art à partir d'une photo prise en boutique (en cours de
  développement, voir la section À venir).

## Rôles et authentification

Chaque employé se connecte avec un code de pointage personnel plutôt
qu'un identifiant et un mot de passe classiques. La session est un cookie
JWT signé, vérifié par toutes les routes protégées.

Deux rôles existent :

- `EMPLOYEE` : accès aux fonctionnalités quotidiennes (pointage, horaire,
  liste de vérification, documentation, génération de publications).
- `SUPERUSER` : accès complet, incluant la gestion des employés, des
  horaires, des lieux de travail, des postes et des paramètres.

Une troisième catégorie de route existe pour les intégrations externes
(voir Routes API, section Intégrations publiques) : elle n'utilise pas de
session employé, mais une clé partagée transmise dans un en-tête de
requête.

## Stack technique

- Next.js (App Router, Turbopack), TypeScript
- Prisma avec Postgres hébergé sur Neon, via le pilote serverless
- Sessions par cookie JWT (bibliothèque jose), codes de pointage hachés
  avec argon2
- Tailwind CSS et des composants d'interface construits sur Radix UI
- next-intl pour la traduction français et anglais
- API OpenAI pour la génération de texte et, à terme, l'analyse d'images

## Structure du projet

Le code de l'application vit dans le dossier `prototype`.

- `app` : pages et routes API, organisées par l'App Router de Next.js. Les
  pages employées vivent sous `app/[locale]/(app)`.
- `lib` : logique métier et utilitaires partagés (authentification, accès
  à la base de données, intégrations externes).
- `prisma` : schéma de base de données et script d'amorçage.
- `translations` : chaînes traduites, un fichier par fonctionnalité.
- `components/ui` : composants d'interface réutilisables.

Le reste du dépôt contient des notes de planification internes, hors de
l'application elle-même.

## Routes API

Toutes les routes protégées par une session renvoient 401 sans session
valide et 403 si le rôle ne convient pas. Sauf mention contraire, les
routes de type liste (GET) sont accessibles à tout employé connecté, et
les routes de création, modification ou suppression sont réservées aux
superviseurs.

### Authentification

| Méthode | Route | Accès | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Public | Authentifie par code de pointage et pose le cookie de session. |
| POST | `/api/auth/logout` | Public | Efface le cookie de session. |
| GET | `/api/me` | Employé | Retourne la session en cours. |

### Pointage

| Méthode | Route | Accès | Description |
| --- | --- | --- | --- |
| POST | `/api/clock` | Employé | Pointe l'entrée ou la sortie de l'employé connecté. |
| GET | `/api/clock-events` | Superviseur | Liste les pointages d'un employé, filtrables par plage de dates. |
| POST | `/api/clock-events` | Superviseur | Crée un pointage manuel, par exemple pour corriger un oubli. |
| PATCH | `/api/clock-events/[id]` | Superviseur | Modifie un pointage. |
| DELETE | `/api/clock-events/[id]` | Superviseur | Supprime un pointage. |

### Horaire

| Méthode | Route | Accès | Description |
| --- | --- | --- | --- |
| GET | `/api/shifts` | Employé | Liste les quarts, filtrables par employé, lieu de travail et date. |
| POST | `/api/shifts` | Superviseur | Crée un quart. |
| GET | `/api/shifts/[id]` | Employé | Récupère un quart précis. |
| PATCH | `/api/shifts/[id]` | Superviseur | Modifie l'assignation ou la plage horaire d'un quart. |
| DELETE | `/api/shifts/[id]` | Superviseur | Supprime un quart. |
| POST | `/api/shifts/copy-week` | Superviseur | Copie tous les quarts d'une semaine source vers une semaine cible. |

### Liste de vérification

| Méthode | Route | Accès | Description |
| --- | --- | --- | --- |
| GET | `/api/checklist` | Employé | Liste les items avec leur état pour le cycle de récurrence en cours. |
| POST | `/api/checklist` | Superviseur | Crée un item. |
| PATCH | `/api/checklist/[id]` | Employé ou superviseur | Coche ou décoche un item; renommer ou changer sa récurrence est réservé au superviseur. |
| DELETE | `/api/checklist/[id]` | Superviseur | Supprime un item. |
| GET | `/api/checklist/categories` | Employé | Liste les catégories. |
| POST | `/api/checklist/categories` | Superviseur | Crée une catégorie. |
| PATCH | `/api/checklist/categories/[id]` | Superviseur | Renomme une catégorie. |
| DELETE | `/api/checklist/categories/[id]` | Superviseur | Supprime une catégorie; ses items deviennent non catégorisés. |

### Documentation interne

| Méthode | Route | Accès | Description |
| --- | --- | --- | --- |
| GET | `/api/doc/links` | Employé | Liste les liens de documentation. |
| POST | `/api/doc/links` | Superviseur | Crée un lien. |
| PATCH | `/api/doc/links/[id]` | Superviseur | Modifie un lien. |
| DELETE | `/api/doc/links/[id]` | Superviseur | Supprime un lien. |
| GET | `/api/doc/categories` | Employé | Liste les catégories. |
| POST | `/api/doc/categories` | Superviseur | Crée une catégorie. |
| PATCH | `/api/doc/categories/[id]` | Superviseur | Renomme une catégorie. |
| DELETE | `/api/doc/categories/[id]` | Superviseur | Supprime une catégorie; ses liens deviennent non catégorisés. |

### Employés

| Méthode | Route | Accès | Description |
| --- | --- | --- | --- |
| GET | `/api/employees` | Superviseur | Liste tous les employés, actifs en premier. |
| POST | `/api/employees` | Superviseur | Crée un employé. |
| PATCH | `/api/employees/[id]` | Superviseur | Modifie un employé, incluant son code, son rôle ou son statut actif. |
| DELETE | `/api/employees/[id]` | Superviseur | Désactive un employé; aucune suppression physique n'est effectuée. |
| GET | `/api/employees/generate-code` | Superviseur | Suggère un code de pointage unique pour un nouvel employé. |
| PUT | `/api/employees/[id]/availability` | Employé | Remplace l'ensemble des disponibilités d'un employé. |

### Postes et lieux de travail

| Méthode | Route | Accès | Description |
| --- | --- | --- | --- |
| GET | `/api/positions` | Employé | Liste les postes. |
| POST | `/api/positions` | Superviseur | Crée un poste. |
| PATCH | `/api/positions/[id]` | Superviseur | Modifie un poste. |
| DELETE | `/api/positions/[id]` | Superviseur | Supprime un poste; les quarts qui l'utilisaient perdent leur poste. |
| GET | `/api/workplaces` | Superviseur | Liste les lieux de travail. |
| POST | `/api/workplaces` | Superviseur | Crée un lieu de travail. |
| PATCH | `/api/workplaces/[id]` | Superviseur | Modifie un lieu de travail. |
| DELETE | `/api/workplaces/[id]` | Superviseur | Supprime un lieu de travail, si plus aucun quart ne lui est assigné. |

### Réunions et événements

| Méthode | Route | Accès | Description |
| --- | --- | --- | --- |
| GET | `/api/daily-meetings` | Employé | Liste les réunions journalières. |
| POST | `/api/daily-meetings` | Superviseur | Crée une réunion. |
| PATCH | `/api/daily-meetings/[id]` | Superviseur | Modifie une réunion. |
| DELETE | `/api/daily-meetings/[id]` | Superviseur | Supprime une réunion. |
| GET | `/api/events` | Employé | Liste les événements, avec filtre optionnel sur une plage de dates. |
| POST | `/api/events` | Superviseur | Crée un événement. |
| PATCH | `/api/events/[id]` | Superviseur | Modifie un événement. |
| DELETE | `/api/events/[id]` | Superviseur | Supprime un événement. |

### Publications

| Méthode | Route | Accès | Description |
| --- | --- | --- | --- |
| GET | `/api/posts/media` | Employé | Liste les médias, c'est-à-dire les plateformes où publier. |
| POST | `/api/posts/media` | Superviseur | Crée un média. |
| PATCH | `/api/posts/media/[id]` | Superviseur | Renomme un média. |
| DELETE | `/api/posts/media/[id]` | Superviseur | Supprime un média et son historique de génération. |
| GET | `/api/posts/media/[id]/topics` | Employé | Liste les sujets pour ce média, traités et à traiter. |
| GET | `/api/posts/topics` | Employé | Liste les sujets avec leurs documents de référence. |
| POST | `/api/posts/topics` | Superviseur | Crée un sujet. |
| PATCH | `/api/posts/topics/[id]` | Superviseur | Renomme un sujet. |
| DELETE | `/api/posts/topics/[id]` | Superviseur | Supprime un sujet, ses documents et son historique. |
| POST | `/api/posts/topics/sync-artur` | Employé | Importe les nouveaux articles du blogue d'artur.art comme sujets. |
| GET | `/api/posts/topics/[id]/documents` | Employé | Liste les documents de référence d'un sujet. |
| POST | `/api/posts/topics/[id]/documents` | Superviseur | Ajoute un document de référence, en texte brut. |
| DELETE | `/api/posts/topics/[id]/documents/[documentId]` | Superviseur | Supprime un document de référence. |
| POST | `/api/posts/topics/[id]/generate` | Employé | Génère un brouillon de texte pour un sujet et un média donnés. |
| GET | `/api/posts/topics/[id]/generations` | Employé | Historique des textes déjà générés pour un sujet. |
| POST | `/api/posts/topics/[id]/generations` | Employé | Enregistre un texte généré dans l'historique. |

### Intégrations publiques

Routes destinées à d'autres applications plutôt qu'à un employé connecté;
elles n'exigent pas de session mais une clé partagée.

| Méthode | Route | Accès | Description |
| --- | --- | --- | --- |
| GET | `/api/public/employees` | Clé API (en-tête x-api-key) | Liste le prénom et le nom des employés actifs, destinée à l'application de caisse. Ne renvoie jamais le code de pointage. |

## Variables d'environnement

Voir `prototype/.env.example` pour la liste à jour et les commentaires
détaillés. Résumé :

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Chaîne de connexion Postgres, Neon en production. |
| `JWT_SECRET` | Clé de signature des cookies de session. |
| `DEV_CLOCK_IP` | Réservé au développement local, permet de tester le pointage sans proxy. |
| `OPENAI_API_KEY` | Clé utilisée pour la génération de texte des publications. |
| `CAISSE_API_KEY` | Clé partagée avec l'application de caisse pour `/api/public/employees`. |

## Développement local

Depuis le dossier `prototype` :

1. `npm install`
2. Copier `.env.example` en `.env.local` et remplir les valeurs.
3. `npx prisma generate`
4. `npm run db:push` pour appliquer le schéma.
5. `npm run db:seed` pour créer des comptes de test.
6. `npm run dev`, puis se connecter avec un des codes de pointage créés
   par le script d'amorçage.

`npm run check` lance la vérification de types, le lint et les tests; à
exécuter avant toute proposition de changement.

## À venir

Une fonctionnalité d'identification d'oeuvre par photo est en cours de
conception : un employé pourrait prendre une oeuvre en photo et obtenir
son titre, son artiste et sa description à partir du catalogue
artur.art, en comparant l'image à celles déjà cataloguées. L'interface
d'amorce existe dans la section Publications; la logique de comparaison
n'est pas encore branchée.
