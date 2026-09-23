import type { Translation } from "./types";

export const docTranslations: Record<string, Translation> = {
    title: { en: "Docs", fr: "Docs" },
    addCategory: { en: "Add a category", fr: "Ajouter une catégorie" },
    editCategory: { en: "Edit category", fr: "Modifier la catégorie" },
    deleteCategory: { en: "Delete category", fr: "Supprimer la catégorie" },
    categoryNameLabel: { en: "Category name", fr: "Nom de la catégorie" },
    uncategorized: { en: "Uncategorized", fr: "Sans catégorie" },
    addLink: { en: "Add a link", fr: "Ajouter un lien" },
    editLink: { en: "Edit", fr: "Modifier" },
    deleteLink: { en: "Delete", fr: "Supprimer" },
    titleLabel: { en: "Title", fr: "Titre" },
    urlLabel: { en: "URL", fr: "URL" },
    categoryLabel: { en: "Category", fr: "Catégorie" },
    noCategoryOption: { en: "No category", fr: "Aucune catégorie" },
    cancel: { en: "Cancel", fr: "Annuler" },
    save: { en: "Save", fr: "Enregistrer" },
    saveError: { en: "Something went wrong, please try again.", fr: "Une erreur est survenue, réessaie." },
    empty: { en: "No links yet", fr: "Aucun lien pour le moment" },
};
