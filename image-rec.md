# Identification d'une œuvre à partir d'une photo (clockin + artur)

Statut : plan à valider, rien n'est implémenté. L'UI sera d'abord
construite dans la section "posts" avant d'attaquer le reste.

## Contexte

Un employé clockin peut uploader une photo d'une œuvre physique et se faire
retourner sa description et le nom de l'artiste, en la comparant au
catalogue artur.art. artur possède déjà toute l'infrastructure de bas
niveau (extraction d'embedding par vision, recherche par similarité,
lookup produit/artiste) mais utilisée pour une autre fonctionnalité
(recommandations "œuvres similaires"), pas pour de l'identification.

Architecture retenue (décidée avec l'utilisateur) : plutôt qu'une route
artur qui fait tout le travail (vision + matching + décision), artur
expose seulement un export brut des vecteurs déjà stockés, et clockin fait
lui-même la vision, l'embedding de la photo uploadée, le calcul de
similarité, et le lookup final via une route artur **déjà existante**
(`/api/services/produits`). Ça minimise le nouveau code sur artur (site de
production, changements plus sensibles) et garde toute la logique "métier"
ajustable côté clockin. Ça suit aussi un pattern déjà en place dans
clockin : `sync-artur` importe déjà périodiquement les articles de blogue
d'artur de la même manière (pull manuel, pas de flux temps réel).

Aucune persistance des résultats d'identification eux-mêmes n'est prévue
(requête sans état, comme les brouillons de `posts` avant sauvegarde) —
seul le cache des vecteurs d'artur est stocké côté clockin.

## A. Repo artur (`/home/toto/loriginal/react/artur`)

### Nouvelle route : `app/api/embed/export/route.ts`

Route de lecture seule (aucun appel OpenAI), qui exporte les lignes de la
table Supabase `art_embeddings` (`productID`, `art_embedding`) par pages,
via curseur sur `productID` :

- `GET /api/embed/export?cursor=<lastProductId>&limit=<n>` (défaut 500,
  max 1000).
- Réponse : `{ items: [{ productId, embedding: number[] }], nextCursor: number | null }`.
- `art_embedding` revient parfois en string depuis Supabase (voir
  `lib/utils.ts` `dotProduct`) — parser avec `JSON.parse` si `typeof === "string"`.
- Protection : `Authorization: Bearer <EMBEDDINGS_EXPORT_SECRET>`, comparé
  avec `crypto.timingSafeEqual` (comme `lib/auth/requireApiKey.ts` côté
  clockin) plutôt que le simple `===` utilisé par `CRON_SECRET`
  (`app/api/cron/relance/route.ts`) — cette route expose tout le catalogue
  de vecteurs propriétaires, pas juste un déclenchement de cron.
- **Pagination obligatoire, pas juste souhaitable** : ~3000 lignes ×
  ~1536 floats en JSON ≈ 90 Mo si tout était renvoyé d'un coup ; à
  `limit=500` chaque page fait ~15 Mo. De plus, Supabase/PostgREST plafonne
  souvent les `.select()` sans `.range()` à ~1000 lignes par défaut
  (réglage du projet, pas vérifiable depuis le code) — la pagination par
  curseur protège contre ça de toute façon.
- Nouvelle variable d'env `EMBEDDINGS_EXPORT_SECRET` (à documenter dans le
  `.env.example` d'artur s'il existe, sinon là où `CRON_SECRET` est déjà
  documenté).

**Rien d'autre ne change côté artur** — `/api/services/produits` (déjà
public, déjà filtré sur `artiste.confirmed === 1`) est réutilisée telle
quelle pour le lookup final.

## B. Repo clockin (`/home/toto/loriginal/clockin/prototype`)

### 1. Schéma Prisma — nouveau modèle

```prisma
/// Cache local des vecteurs art_embeddings d'artur.art, synchronisé
/// périodiquement via POST /api/identify/sync-artur. Stocké en Float[]
/// plutôt que pgvector : ce projet n'a pas d'extension Postgres configurée
/// (db push, pas de dossier migrations), et un calcul de similarité en JS
/// sur ~3000 lignes prend largement moins de 50ms — pas justifié d'ajouter
/// pgvector pour ce volume.
model ArturArtworkEmbedding {
  productId Int      @id @map("product_id")
  embedding Float[]
  syncedAt  DateTime @updatedAt @map("synced_at")

  @@map("artur_artwork_embeddings")
}
```

Après ajout : `npx prisma generate`, puis `npm run db:push`.

### 2. `lib/identify/arturEmbeddingsExport.ts` (nouveau)

Fetch sortant vers artur, même forme que `lib/posts/arturBlog.ts`
(`AbortController`), mais timeout à 30s (page ~15 Mo, pas juste du JSON
texte) et header `Authorization: Bearer`. Générateur async
`fetchAllArturEmbeddings()` qui pagine jusqu'à `nextCursor === null`.

### 3. `lib/identify/normalizeVector.ts` (nouveau)

Réimplémentation triviale de `normalizeVector` d'artur (`lib/utils.ts`) :
`v.map(x => x / sqrt(sum(x_i^2)))`.

### 4. `lib/identify/describeAndEmbedImage.ts` (nouveau)

Mirroir de `extract()` d'artur (`app/api/openai/embeddings.ts`) et du
prompt de `recommend-by-image/route.ts`, avec le client OpenAI
lazy-singleton de clockin (pattern de `lib/posts/generateText.ts`) :

1. Appel vision (`gpt-4o-mini`, `detail: "low"`, `response_format: json_object`)
   sur le data URI uploadé, avec un prompt demandant style/sujet/couleurs/médium/tags.
2. Embedding du texte JSON retourné via `text-embedding-3-small`.
3. Normalisation via `normalizeVector`.

Exporte aussi `NotConfiguredError` (si `OPENAI_API_KEY` absent), même
pattern que `lib/posts/generateText.ts`.

### 5. `lib/identify/matchArtwork.ts` (nouveau)

- `MATCH_CONFIDENCE_THRESHOLD` — **constante à ajuster empiriquement**,
  valeur de départ 0.85 mais explicitement documentée comme non calibrée :
  aucun moyen de connaître le bon seuil sans tester sur de vraies photos.
- `findBestMatch(queryEmbedding)` : charge tous les `ArturArtworkEmbedding`
  via `withPrisma`, calcule le produit scalaire (vecteurs déjà normalisés
  des deux côtés) contre chacun, retourne le meilleur `{ productId, similarity }`
  même si sous le seuil (pour que l'UI puisse afficher le score de
  confiance à l'employé).

### 6. `lib/identify/arturProduitLookup.ts` (nouveau)

`fetchArturProduitDetail(productId)` — GET
`https://www.artur.art/api/services/produits?id=<id>&projection=detail`,
même pattern de timeout que `arturBlog.ts`. Retourne `null` si
`produits[]` est vide.

**Cas particulier confirmé dans le code** : `/api/services/produits`
filtre sur `artiste.confirmed === 1`, donc un match vectoriel valide peut
légitimement renvoyer un tableau vide (artiste actuellement non publié).
Ce cas doit être distingué de "aucun match visuel" dans la réponse et
l'UI.

### 7. `app/api/identify/route.ts` (nouveau) — upload de l'employé

- `requireEmployee()` en premier (catch `UnauthorizedError` → 401).
- `FormData` avec un champ `file` — valider `instanceof File`,
  `type.startsWith("image/")`, taille max (garde-fou serveur ~4 Mo ; le
  vrai plafond se fait côté client, voir point 9).
- Convertit en data URI base64, appelle `describeAndEmbedImage`, puis
  `findBestMatch`.
- Sous le seuil → `{ match: null, similarity, threshold }`.
- Au-dessus du seuil → `fetchArturProduitDetail(productId)` :
  - échec réseau → 502 `artur_unreachable`
  - `null` (artiste non publié) → `{ match: null, unavailableProductId, similarity, threshold }`
  - trouvé → `{ match: { productId, title, artistName, descriptionFr, descriptionEn }, similarity, threshold }`
- `NotConfiguredError` (pas de clé OpenAI) → 503 `not_configured`, même
  pattern que `app/api/posts/topics/[id]/generate/route.ts`.

### 8. `app/api/identify/sync-artur/route.ts` (nouveau)

Même forme que `app/api/posts/topics/sync-artur/route.ts` : `POST`,
`requireEmployee()` (confirmé : ce projet n'a pas de cron — pas de
`vercel.json` — donc synchronisation manuelle via bouton, pas
automatique, pour cette v1). Pagine via `fetchAllArturEmbeddings()`,
`upsert` chaque page dans `ArturArtworkEmbedding`. `artur_unreachable`
en cas d'échec réseau. Pas de suppression des lignes obsolètes en v1
(comportement additif, comme `sync-artur` pour les sujets) — limite
connue et acceptable pour un outil interne à faible enjeu.

### 9. UI — `app/[locale]/(app)/identify/page.tsx` + `identifyView.tsx`

- `page.tsx` (server component) : session (`getSession`), compte et date
  du dernier sync (`ArturArtworkEmbedding.count()` /
  `findFirst({ orderBy: { syncedAt: "desc" } })`), passés à `IdentifyView`.
- `identifyView.tsx` (`"use client"`) : `PageHeading`, bouton "Rafraîchir
  depuis artur.art" (même pattern que `handleRefreshFromArtur` dans
  `postsView.tsx`, contre `/api/identify/sync-artur`), input file caché +
  bouton visible (pattern `handleUpload` de `editTopic.tsx`).
- **Redimensionnement côté client obligatoire avant upload** (via
  `<canvas>`, `createImageBitmap` → max 1024px de côté → JPEG qualité
  0.8) : une photo de téléphone brute (3-10 Mo) est inutile pour un
  modèle vision en `detail: "low"` et risque de dépasser les limites de
  taille de requête d'une fonction serverless Vercel.
- Affiche titre, artiste, description (fr/en selon la langue), et le
  score de similarité + seuil (pour que l'employé juge lui-même de la
  confiance).

**Note du 2026-09-27** : l'UI sera d'abord construite dans la section
`posts` existante avant d'implémenter le reste de cette fonctionnalité —
voir avec l'utilisateur la forme exacte souhaitée (nouvel onglet dans
`posts`, ou vraiment une nouvelle page séparée comme décrit ci-dessus) au
moment de reprendre ce plan.

### 10. Nav + traductions

- `app/[locale]/(app)/navbar.tsx` : ajouter `{ href: "/identify", key: "identify" }`
  à `navItems`.
- `translations/navbar.ts` : `identify: { en: "Identify", fr: "Identifier" }`.
- Nouveau `translations/identify.ts` (même forme que `translations/posts.ts`),
  exporté depuis `translations/index.ts`.

### 11. Variables d'environnement

`.env.example` de clockin, même style que l'entrée `CAISSE_API_KEY` :

```
# Secret envoyé en Authorization: Bearer pour appeler GET /api/embed/export
# d'artur.art (voir lib/identify/arturEmbeddingsExport.ts). Même valeur que
# EMBEDDINGS_EXPORT_SECRET côté artur.
ARTUR_EMBEDDINGS_EXPORT_SECRET=
```

`OPENAI_API_KEY` est déjà présent, rien à ajouter pour ça.

## Risques / hypothèses à valider empiriquement

1. Le plafond par défaut de Supabase/PostgREST sur les `.select()` sans
   `.range()` (souvent ~1000 lignes) n'est pas vérifiable depuis le code —
   à confirmer en testant l'export contre les ~3000 lignes réelles.
2. `MATCH_CONFIDENCE_THRESHOLD = 0.85` est un placeholder, pas une valeur
   mesurée — à ajuster après des essais avec de vraies photos.
3. Le lookup produit peut renvoyer vide même pour un match vectoriel
   valide (artiste non `confirmed`) — géré explicitement, pas un bug.
4. Pas de nettoyage des lignes obsolètes dans le cache (comportement
   additif) — une œuvre supprimée/dépubliée sur artur peut rester
   "trouvable" côté clockin jusqu'au prochain constat manuel.
5. Le redimensionnement côté client est une exigence de correction, pas
   juste une optimisation — sans lui, une photo brute pourrait dépasser
   les limites de taille de requête.

## Vérification de bout en bout

1. **Côté artur** : déployer/lancer en local `app/api/embed/export/route.ts`,
   tester avec `curl` + le bon `Authorization: Bearer` que la pagination
   ramène bien la totalité des ~3000 lignes sans doublon ni trou (comparer
   la somme des `items.length` sur toutes les pages au compte réel de la
   table `art_embeddings`).
2. **Sync** : côté clockin, `npm run dev`, se logger (`EMP001`/`SUP001`),
   déclencher `POST /api/identify/sync-artur`, vérifier via Prisma Studio
   ou une requête directe que `ArturArtworkEmbedding` contient bien
   ~3000 lignes après le sync.
3. **Identification** : uploader une vraie photo d'une œuvre du catalogue
   artur (prise dans des conditions différentes de la photo studio :
   angle, éclairage) via l'UI `/identify`, vérifier que le bon
   `productId`/artiste/description ressort, et noter le score de
   similarité obtenu pour calibrer `MATCH_CONFIDENCE_THRESHOLD`.
4. Tester aussi une photo qui ne correspond à rien du catalogue (ex. une
   photo random) pour confirmer que la réponse "aucun match confiant"
   s'affiche plutôt qu'un faux positif.
5. `npx tsc --noEmit` et `eslint` sur les fichiers touchés, des deux
   côtés, avant de considérer la fonctionnalité terminée (voir
   `AGENTS.md` de clockin pour la séquence exacte avec `next typegen`).
