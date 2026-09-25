import type { Translation } from "./types";

// Strings for the timesheets page: clock event log, active/expected shift
// status widgets, and per-day navigation.
export const timesheetsTranslations: Record<string, Translation> = {
    title: { en: "Timesheets", fr: "Feuilles de temps" },
    selectEmployee: { en: "Employee", fr: "Employé" },
    addEvent: { en: "Add a clock event", fr: "Ajouter un pointage" },
    editEvent: { en: "Edit", fr: "Modifier" },
    deleteEvent: { en: "Delete", fr: "Supprimer" },
    typeLabel: { en: "Type", fr: "Type" },
    atLabel: { en: "Date & time", fr: "Date et heure" },
    workplaceLabel: { en: "Workplace", fr: "Lieu" },
    noteLabel: { en: "Note", fr: "Note" },
    cancel: { en: "Cancel", fr: "Annuler" },
    save: { en: "Save", fr: "Enregistrer" },
    saveError: { en: "Something went wrong, please try again.", fr: "Une erreur est survenue, réessaie." },
    activeStatusTitle: { en: "Currently clocked in", fr: "Actuellement en poste" },
    activeStatusEmpty: { en: "No one is clocked in right now", fr: "Personne n'est actuellement en poste" },
    activeStatusSince: { en: "since", fr: "depuis" },
    expectedStatusTitle: { en: "Should be clocked in", fr: "Devrait être en poste" },
    expectedStatusEmpty: { en: "No one is scheduled right now", fr: "Personne n'est prévu au poste en ce moment" },
    expectedStatusClockedIn: { en: "Clocked in", fr: "En poste" },
    expectedStatusNotClockedIn: { en: "Not clocked in", fr: "Pas encore en poste" },
    previousDay: { en: "Previous day", fr: "Jour précédent" },
    nextDay: { en: "Next day", fr: "Jour suivant" },
    today: { en: "Today", fr: "Aujourd'hui" },
    totalThisDay: { en: "Total this day", fr: "Total ce jour" },
    noEventsThisDay: { en: "No clock-in/out this day", fr: "Aucun pointage ce jour" },
};
