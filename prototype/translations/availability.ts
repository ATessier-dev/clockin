import type { Translation } from "./types";

// Strings for the availability page: weekly day picker for an employee's
// own availability, plus the manager-facing team availability view.
export const availabilityTranslations: Record<string, Translation> = {
    title: { en: "Availability", fr: "Disponibilités" },
    hours: { en: "11am - 6pm", fr: "11h - 18h" },
    description: {
        en: "Pick the days and workplaces you're available to work.",
        fr: "Choisis les jours et lieux de travail où tu es disponible.",
    },
    empty: { en: "No workplaces have been added yet.", fr: "Aucun lieu de travail n'a encore été ajouté." },
    save: { en: "Save", fr: "Enregistrer" },
    saved: { en: "Availability saved.", fr: "Disponibilités enregistrées." },
    saveError: { en: "Something went wrong, please try again.", fr: "Une erreur est survenue, réessaie." },
    monday: { en: "Monday", fr: "Lundi" },
    tuesday: { en: "Tuesday", fr: "Mardi" },
    wednesday: { en: "Wednesday", fr: "Mercredi" },
    thursday: { en: "Thursday", fr: "Jeudi" },
    friday: { en: "Friday", fr: "Vendredi" },
    saturday: { en: "Saturday", fr: "Samedi" },
    sunday: { en: "Sunday", fr: "Dimanche" },
    mondayShort: { en: "Mon", fr: "Lun" },
    tuesdayShort: { en: "Tue", fr: "Mar" },
    wednesdayShort: { en: "Wed", fr: "Mer" },
    thursdayShort: { en: "Thu", fr: "Jeu" },
    fridayShort: { en: "Fri", fr: "Ven" },
    saturdayShort: { en: "Sat", fr: "Sam" },
    sundayShort: { en: "Sun", fr: "Dim" },
    teamTitle: { en: "Team availability", fr: "Disponibilités de l'équipe" },
    teamEmpty: { en: "No active employees.", fr: "Aucun employé actif." },
};
