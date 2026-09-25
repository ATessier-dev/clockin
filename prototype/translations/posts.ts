import type { Translation } from "./types";

// Strings for the social media post generator: a Media list (where to
// post) and an independent Topics list (what to post about), plus text
// generation (with regenerate/edit/save) and its history.
export const postsTranslations: Record<string, Translation> = {
    title: { en: "Posts", fr: "Publications" },
    tokenCostNotice: {
        en: "Each generation (and regeneration) calls a paid AI model. Generate thoughtfully rather than repeatedly.",
        fr: "Chaque génération (et régénération) fait appel à un modèle d'IA payant. Génère avec discernement plutôt qu'à répétition.",
    },
    cancel: { en: "Cancel", fr: "Annuler" },
    save: { en: "Save", fr: "Enregistrer" },
    saveError: { en: "Something went wrong, please try again.", fr: "Une erreur est survenue, réessaie." },

    mediaSectionTitle: { en: "Media", fr: "Médias" },
    addMedia: { en: "Add a medium", fr: "Ajouter un média" },
    editMedia: { en: "Edit medium", fr: "Modifier le média" },
    deleteMedia: { en: "Delete medium", fr: "Supprimer le média" },
    mediaNameLabel: { en: "Medium name", fr: "Nom du média" },
    emptyMedia: { en: "No media yet", fr: "Aucun média pour le moment" },

    topicsSectionTitle: { en: "Topics", fr: "Sujets" },
    addTopic: { en: "Add a topic", fr: "Ajouter un sujet" },
    editTopic: { en: "Edit", fr: "Modifier" },
    deleteTopic: { en: "Delete", fr: "Supprimer" },
    titleLabel: { en: "Topic", fr: "Sujet" },
    empty: { en: "No topics yet", fr: "Aucun sujet pour le moment" },

    documentsLabel: { en: "Reference documents (.txt)", fr: "Documents de référence (.txt)" },
    addDocument: { en: "Add a document", fr: "Ajouter un document" },
    deleteDocument: { en: "Delete document", fr: "Supprimer le document" },
    invalidDocument: {
        en: "Only .txt files under 200 KB are accepted.",
        fr: "Seuls les fichiers .txt de moins de 200 Ko sont acceptés.",
    },
    documentsHint: {
        en: "Save the topic before adding reference documents.",
        fr: "Enregistre le sujet avant d'ajouter des documents de référence.",
    },

    generate: { en: "Generate", fr: "Générer" },
    generating: { en: "Generating…", fr: "Génération…" },
    regenerate: { en: "Regenerate", fr: "Régénérer" },
    copy: { en: "Copy", fr: "Copier" },
    copied: { en: "Copied!", fr: "Copié !" },
    history: { en: "History", fr: "Historique" },
    noHistory: { en: "No text generated yet", fr: "Aucun texte généré pour le moment" },
    generationError: { en: "Something went wrong, please try again.", fr: "Une erreur est survenue, réessaie." },
    notConfigured: {
        en: "Text generation isn't set up yet.",
        fr: "La génération de texte n'est pas encore configurée.",
    },

    untreatedTopics: { en: "Topics to cover", fr: "Sujets à traiter" },
    noUntreatedTopics: { en: "Every topic has been covered", fr: "Tous les sujets ont été traités" },
    treatedTopics: { en: "Already covered", fr: "Déjà traités" },
    backToTopics: { en: "Back to topics", fr: "Retour aux sujets" },

    refreshTopics: { en: "Refresh from artur.art", fr: "Rafraîchir depuis artur.art" },
    refreshingTopics: { en: "Checking…", fr: "Vérification…" },
    importedFromArtur: { en: "artur.art", fr: "artur.art" },
    noNewTopics: { en: "No new blog posts found", fr: "Aucun nouveau blogue trouvé" },
    newTopicsImportedSuffix: { en: "new topic(s) imported", fr: "nouveau(x) sujet(s) importé(s)" },
    arturUnreachable: {
        en: "Couldn't reach artur.art, try again later.",
        fr: "Impossible de contacter artur.art, réessaie plus tard.",
    },
};
