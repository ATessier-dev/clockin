import type { Translation } from "./types";

// Strings for the social media post generator: topics (with reference
// documents) grouped into categories, plus text generation (with
// regenerate/edit/save) and its history.
export const postsTranslations: Record<string, Translation> = {
    title: { en: "Posts", fr: "Publications" },
    addTopic: { en: "Add a topic", fr: "Ajouter un sujet" },
    editTopic: { en: "Edit", fr: "Modifier" },
    deleteTopic: { en: "Delete", fr: "Supprimer" },
    titleLabel: { en: "Topic", fr: "Sujet" },
    cancel: { en: "Cancel", fr: "Annuler" },
    save: { en: "Save", fr: "Enregistrer" },
    saveError: { en: "Something went wrong, please try again.", fr: "Une erreur est survenue, réessaie." },
    empty: { en: "No topics yet", fr: "Aucun sujet pour le moment" },
    addCategory: { en: "Add a category", fr: "Ajouter une catégorie" },
    editCategory: { en: "Edit category", fr: "Modifier la catégorie" },
    deleteCategory: { en: "Delete category", fr: "Supprimer la catégorie" },
    categoryNameLabel: { en: "Category name", fr: "Nom de la catégorie" },
    uncategorized: { en: "Uncategorized", fr: "Sans catégorie" },
    categoryLabel: { en: "Category", fr: "Catégorie" },
    noCategoryOption: { en: "No category", fr: "Aucune catégorie" },

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
};
