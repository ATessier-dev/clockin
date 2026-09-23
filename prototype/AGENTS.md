<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Pipeline de développement (clockin)

Ce projet est développé avec l'aide d'agents IA (Claude Code). Cette
section documente le processus à suivre pour rester cohérent avec le
reste du code — lis-la avant d'ajouter une feature, pas seulement
avant un `git commit`.

## 1. Créer une branche

- Ne jamais coder directement sur `main` (ou `master`) — toujours créer
  une branche d'abord : `git checkout -b <type>/<nom-court>`.
- Nommage `<type>/<nom-descriptif-en-kebab-case>` :
  - `feat/...` — nouvelle fonctionnalité (ex. `feat/liste-tache`,
    `feat/phone-dispatcher`)
  - `patch/...` ou `fix/...` — correctif, ajustement, bug fix (ex.
    `patch/responsive`, `patch/time-sheet/today-button`)
- Un `/` supplémentaire peut grouper par zone (ex.
  `feat/settings/station`, `patch/time-sheet/today-button`) — utile
  quand plusieurs branches touchent la même feature.
- En cas de doute sur le nom ou le type, demander à l'utilisateur
  plutôt que de deviner.

## 2. Avant de coder

- Cherche d'abord le pattern existant le plus proche (`grep`/recherche
  de fichiers) plutôt que d'inventer une nouvelle structure. Ce projet
  a des features très similaires entre elles (checklist, workplaces,
  positions...) — copie leur forme.
- Vérifie s'il existe déjà un modèle Prisma, une route API ou un
  composant qui fait presque ce qu'il faut avant d'en créer un nouveau.

## 3. Modèle de données

- `prisma/schema.prisma`, pas de dossier `migrations/`, ce projet
  utilise le workflow `prisma db push` (`npm run db:push`).
- Chaque modèle a un commentaire `///` qui explique une décision non
  évidente (pourquoi ce champ est nullable, pourquoi pas de cascade,
  etc.), jamais ce que le champ fait puisque ça se voit déjà par son
  nom.
- Un pattern répété : catalogue superviseur avec `sortOrder` (nouvel
  élément égal au dernier `sortOrder` plus un), champ `color` en hex
  (`#RRGGBB`) pour une pastille visuelle (voir `Workplace`,
  `ChecklistCategory`, `Position`).
- Si un modèle référencé (ex. catégorie, poste) peut être supprimé
  sans casser les lignes qui le référencent, utiliser
  `onDelete: SetNull` sur une FK optionnelle plutôt que d'empêcher la
  suppression.

### Style des commentaires (code)

Applicable à tout commentaire de code (`///`, `//`, JSDoc), pas
seulement à Prisma.

- Expliquer uniquement le pourquoi (une contrainte, un choix non
  évident, une limite connue), jamais le quoi : le code lui-même,
  bien nommé, montre déjà ce qu'il fait.
- Ne pas ajouter de commentaire si le code est déjà clair sans lui.
- Pas de tiret (`-`, `–`, `—`) utilisé comme séparateur stylistique
  dans une phrase. Reformuler avec une virgule, un point, ou deux
  phrases séparées.
- Pas d'emoji.
- Registre professionnel et neutre : phrases complètes, pas de
  familiarité, pas d'humour.
- Rester concis, une ligne dans la grande majorité des cas ; jamais
  de pavé de plusieurs paragraphes.

## 4. Routes API (`app/api/.../route.ts`)

- Toujours `requireEmployee()` ou `requireSuperuser()` en premier
  (`@/lib/auth/requireSession`), dans un `try/catch` qui retourne
  `401` sur `UnauthorizedError` et `403` sur `ForbiddenError`.
- Valider le body à la main (`typeof body?.x === "string"`), jamais
  faire confiance au JSON reçu.
- Après avoir créé une nouvelle route `[id]/route.ts`, lancer
  `npx next typegen` pour que `RouteContext<'/api/.../[id]'>` existe
  (sinon `tsc` échoue) — voir piège connu plus bas.

## 5. UI

- `page.tsx` (server component) fait les requêtes Prisma et passe les
  données à un composant `"use client"` du même dossier.
- Formulaires en composants séparés (`editX.tsx`) avec
  `onCancel` / `onSaved` / `onDeleted`, `fetch()` direct vers l'API,
  puis `router.refresh()` — pas de state management global.
- Pages réservées au superviseur : vérifier `sessionUser.role !==
  "SUPERUSER"` dans le `page.tsx` et `redirect({ href: "/dashboard",
  locale })` (import depuis `@/i18n/navigation`), en plus du blocage
  déjà fait côté API.

## 6. Traductions

- Un fichier par feature dans `translations/`, exporté dans
  `translations/index.ts`. Chaque clé a `{ en, fr }`.
- Le français est la langue par défaut (`defaultLanguage`) et celle
  des messages de commit — l'anglais du code (variables, modèles,
  commentaires) n'a pas besoin d'être traduit.

## 7. Avant de considérer une feature terminée

1. `npx prisma generate` (si le schema a changé)
2. `npx next typegen` puis `git checkout -- next-env.d.ts` (voir piège
   connu ci-dessous)
3. `npx tsc --noEmit` et `npx eslint <fichiers touchés>` — corriger
   toute erreur/warning
4. `npm run db:push` pour appliquer le schema (voir piège IPv6
   ci-dessous s'il échoue avec `P1001`)
5. Tester en conditions réelles plutôt que de se fier au typecheck
   seul : démarrer `npm run dev`, se logger via
   `POST /api/auth/login` avec les comptes de seed (`EMP001` = employé,
   `SUP001` = superviseur) et vérifier avec `curl` (ou le navigateur)
   que les permissions et l'affichage sont corrects.

## 8. Git

- Ne stage **que** les fichiers liés à la demande en cours
  (`git add <fichiers précis>`, jamais `git add -A`) — il y a souvent
  d'autres changements en cours dans l'arbre de travail qui
  appartiennent à une autre feature et ne doivent pas être mélangés.
- Message de commit en français, court, orienté sur le *pourquoi*
  plutôt que la liste des fichiers changés, avec la ligne
  `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- Ne jamais `git push` sans une demande explicite et séparée de
  "commit" — un commit ne vaut pas autorisation de push.
- Ne jamais committer automatiquement sans que ce soit demandé.

## Pièges connus

- **`next typegen` modifie `next-env.d.ts`** pour pointer vers
  `.next/types/` au lieu de `.next/dev/types/` (utilisé par
  `next dev`). C'est un fichier auto-généré qu'il ne faut pas commiter
  dans cet état — `git checkout -- next-env.d.ts` après coup ; `next
  dev` le régénère correctement tout seul.
- **`npm run db:seed` ne charge pas `.env.local`** lui-même
  (contrairement à `prisma db push`, qui passe par `prisma.config.ts`).
  Sourcer les variables avant de l'appeler :
  `set -a; source <(grep -v '^#' .env.local | grep '='); set +a`.
- **`P1001: Can't reach database server`** sur cette machine malgré une
  URL correcte : IPv6 cassé (la route existe mais time out), et le
  moteur Prisma essaie IPv6 avant IPv4. Corrigé une fois pour toutes
  avec `echo 'precedence ::ffff:0:0/96  100' | sudo tee -a
  /etc/gai.conf` (dépriorise IPv6 sans le désactiver). Si l'erreur
  revient sur une autre machine, c'est probablement la même cause —
  vérifier avec `nc -zv <host> 5432` sur les IPv4 vs IPv6 résolues
  avant de soupçonner Neon ou le firewall.
