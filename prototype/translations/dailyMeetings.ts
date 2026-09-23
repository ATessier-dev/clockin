import type { Translation } from "./types";

export const dailyMeetingsTranslations: Record<string, Translation> = {
    title: { en: "Daily meetings", fr: "Réunions journalières" },
    addMeeting: { en: "Add a meeting", fr: "Ajouter une réunion" },
    editMeeting: { en: "Edit", fr: "Modifier" },
    deleteMeeting: { en: "Delete", fr: "Supprimer" },
    nameLabel: { en: "Name", fr: "Nom" },
    timeLabel: { en: "Time", fr: "Heure" },
    daysLabel: { en: "Days", fr: "Jours" },
    noDaysError: { en: "Pick at least one day.", fr: "Choisis au moins un jour." },
    workplaceLabel: { en: "Workplace", fr: "Lieu" },
    cancel: { en: "Cancel", fr: "Annuler" },
    save: { en: "Save", fr: "Enregistrer" },
    saveError: { en: "Something went wrong, please try again.", fr: "Une erreur est survenue, réessaie." },
    empty: { en: "No daily meetings yet", fr: "Aucune réunion journalière pour le moment" },
};
