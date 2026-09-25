import type { Translation } from "./types";

// Strings for managing workplaces (name, description, color).
export const workplacesTranslations: Record<string, Translation> = {
    title: { en: "Workplaces", fr: "Lieux de travail" },
    addWorkplace: { en: "Add a workplace", fr: "Ajouter un lieu" },
    editWorkplace: { en: "Edit", fr: "Modifier" },
    deleteWorkplace: { en: "Delete", fr: "Supprimer" },
    labelLabel: { en: "Name", fr: "Nom" },
    descriptionLabel: { en: "Description", fr: "Description" },
    colorLabel: { en: "Color", fr: "Couleur" },
    cancel: { en: "Cancel", fr: "Annuler" },
    save: { en: "Save", fr: "Enregistrer" },
    saveError: { en: "Something went wrong, please try again.", fr: "Une erreur est survenue, réessaie." },
    deleteInUseError: {
        en: "This workplace still has shifts scheduled and can't be deleted.",
        fr: "Ce lieu a encore des shifts prévus et ne peut pas être supprimé.",
    },
};
