import type { Translation } from "./types";

export const eventsTranslations: Record<string, Translation> = {
    addEvent: { en: "Add an event", fr: "Ajouter un événement" },
    editEvent: { en: "Edit", fr: "Modifier" },
    deleteEvent: { en: "Delete", fr: "Supprimer" },
    titleLabel: { en: "Title", fr: "Titre" },
    descriptionLabel: { en: "Description", fr: "Description" },
    startAtLabel: { en: "Start", fr: "Début" },
    endAtLabel: { en: "End", fr: "Fin" },
    workplaceLabel: { en: "Workplace", fr: "Lieu" },
    noWorkplaceOption: { en: "No specific workplace", fr: "Aucun lieu précis" },
    cancel: { en: "Cancel", fr: "Annuler" },
    save: { en: "Save", fr: "Enregistrer" },
    saveError: { en: "Something went wrong, please try again.", fr: "Une erreur est survenue, réessaie." },
    endBeforeStart: { en: "End must be after start.", fr: "La fin doit être après le début." },
};
