# Pipeline de génération de texte — Plan

Statut : brouillon, à discuter avant implémentation.

## Contexte

La section `/posts` de clockin est structurée et fonctionnelle (médias,
sujets, documents de référence `.txt`, historique des textes sauvegardés,
import automatique des 62 blogues d'artur.art comme sujets). Il ne manque
qu'une seule pièce : `lib/posts/generateText.ts` lève toujours
`NotConfiguredError`, aucun appel LLM n'est câblé.

Ce document couvre uniquement le câblage de cette fonction : quel
provider, quel prompt, quels paramètres d'appel, quelle gestion d'erreurs.

## Décision : provider

**Tranché : OpenAI.** (Le workflow n8n d'artur utilise déjà `gpt-5.4-mini`
pour générer son propre blog, voir
`react/artur/doc/Artur_Blog_Generation_Workflow.md` — probablement le
même compte à réutiliser, à confirmer au moment de configurer la clé.)

Le modèle exact et le SDK précis restent à déterminer au moment de
l'implémentation : ne pas deviner un identifiant de modèle ou une
tarification depuis la mémoire d'entraînement, vérifier auprès de la
documentation OpenAI à ce moment-là (le lineup et les prix changent
régulièrement).

## Ce qui alimente le prompt (déjà en place côté API)

`app/api/posts/topics/[id]/generate/route.ts` appelle déjà
`generateSocialPostText` avec :

- `topicTitle` — le titre du sujet
- `mediaName` — le nom du média ciblé (ex. "Reddit", "LinkedIn"...)
- `referenceDocuments` — les documents `.txt` du sujet (pour les sujets
  importés d'artur : le contenu complet de l'article de blog)
- `previousGenerations` — les textes déjà sauvegardés pour ce sujet,
  tous médias confondus (anti-doublon)

Rien à changer côté route pour cette partie ; le travail est entièrement
dans le corps de `generateSocialPostText`.

## Design du prompt

**Rôle système** : maintenant dans son propre fichier,
`lib/posts/generationPrompt.md` — modifiable directement sans toucher au
code. Couvre le fond (se baser uniquement sur les documents fournis),
l'adaptation par plateforme, l'anti-doublon, et le format de sortie
attendu (texte brut uniquement, pas de markdown, pas de préambule).

**Décision : pas d'agent/assistant persistant côté OpenAI.** Le contenu
de `generationPrompt.md` est relu et renvoyé comme message system à
chaque appel (stateless), plutôt que de créer un assistant configuré une
fois sur la plateforme OpenAI. Raisons : une seule source de vérité (le
fichier du repo, versionné git, sans risque de désynchronisation avec une
copie distante) ; pas de bénéfice réel pour un cas d'usage à appels
indépendants (pas de conversation multi-tours, pas d'outils, pas de
mémoire à faire persister) ; coût du renvoi du prompt à chaque fois
négligeable. À reconsidérer seulement si le besoin évolue vers du
multi-tours ou des outils.

**Message utilisateur** (construit dynamiquement, inchangé) :

```
Sujet : {topicTitle}
Plateforme cible : {mediaName}

Documents de référence :
{referenceDocuments concaténés, chacun préfixé par son nom de fichier}

Textes déjà publiés pour ce sujet (ne pas reproduire, varier l'angle et
la formulation) :
{previousGenerations, ou "Aucun" si vide}
```

**Point d'attention taille de prompt** : un sujet importé d'artur n'a
qu'un seul document (l'article complet, jusqu'à ~200 Ko bruts, mais en
pratique un article de blog fait plutôt 1 à 3k tokens). Un sujet
manuel pourrait accumuler plusieurs documents. Pas de troncature prévue
pour la v1 (le cap de 200 Ko par document existe déjà côté upload) ; à
revisiter si un cas réel dépasse une taille raisonnable de prompt.

## Appel API (OpenAI) — à préciser au moment de coder

- SDK officiel `openai` (à ajouter aux dépendances), clé lue depuis
  `OPENAI_API_KEY` dans `.env.local`.
- Modèle : à choisir au moment de l'implémentation (vérifier le lineup
  et la tarification actuels plutôt que de réutiliser un nom retenu de
  mémoire). `gpt-5.4-mini`, déjà utilisé par artur, est un point de
  départ raisonnable pour une tâche de rédaction courte comme celle-ci.
- Pas de streaming nécessaire (sortie courte, un post social).
- Un seul message system + un seul message user, pas de conversation
  multi-tours, pas de cache de prompt (volume trop faible pour que ça
  vaille la complexité).

## Gestion d'erreurs

- Clé absente/non configurée → déjà géré (`NotConfiguredError` → 503
  `not_configured`, message clair côté UI).
- Erreurs API distinctes à catcher (chaîne du plus spécifique au plus
  générique) : limite de débit → message "réessaie dans un instant" ;
  clé invalide → traiter comme non configuré ; autre erreur API →
  erreur générique (déjà le comportement actuel de l'UI via
  `generationError`). Noms de classes d'erreur exacts du SDK `openai` à
  vérifier au moment de coder.

## Coût estimé

À recalculer une fois le modèle OpenAI choisi (le chiffrage précédent,
~0,9 cent/génération, était basé sur la tarification Anthropic Sonnet 5
et ne s'applique plus).

## Hors scope pour cette v1

- Prompt caching (volume trop faible pour en tirer un bénéfice réel).
- Troncature/résumé automatique de documents de référence trop longs.
- Choix du modèle par l'utilisateur dans l'UI (le modèle reste fixé côté
  code, pas configurable par un employé).
- Tout ce qui touche à la facturation/quota (déjà noté comme hors scope
  dans le plan initial de la section Posts).

## Étapes d'implémentation

1. ~~Confirmer le choix provider~~ — fait (OpenAI).
2. ~~Écrire les instructions de génération~~ — fait,
   `lib/posts/generationPrompt.md`.
3. Choisir le modèle OpenAI exact et vérifier sa tarification actuelle.
4. Ajouter la dépendance SDK (`npm install openai`).
5. Ajouter `OPENAI_API_KEY` à `.env.local` (et `.env.example` en
   placeholder) — clé à fournir par l'utilisateur (compte artur existant
   ou nouveau, à confirmer).
6. Implémenter le corps de `generateSocialPostText` dans
   `lib/posts/generateText.ts` : charge `generationPrompt.md` comme
   message system, construit le message user (sujet/média/documents/
   historique), appelle l'API, gère les erreurs.
7. Vérification (suivant AGENTS.md §7) : `tsc --noEmit`, `eslint`.
8. Test réel : générer pour 2-3 sujets réels (dont au moins un importé
   d'artur), vérifier la qualité, régénérer pour vérifier que le texte
   change, sauvegarder puis regénérer pour vérifier l'anti-doublon
   (le nouveau texte ne doit pas reprendre le précédent mot pour mot).
