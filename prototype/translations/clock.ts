import type { Translation } from "./types";

export const clockTranslations: Record<string, Translation> = {
    clockIn: { en: "Clock in", fr: "Débuter le shift" },
    clockOut: { en: "Clock out", fr: "Terminer le shift" },
    clockedInSince: { en: "Clocked in since", fr: "En poste depuis" },
    notClockedIn: { en: "Not clocked in", fr: "Pas encore en poste" },
    notOnWorkplaceNetwork: {
        en: "You must be on a workplace network to clock in/out.",
        fr: "Tu dois être sur le réseau d'un lieu de travail pour pointer.",
    },
    genericError: { en: "Something went wrong, please try again.", fr: "Une erreur est survenue, réessaie." },
    weekLog: { en: "This week's log", fr: "Historique de la semaine" },
    noEventsThisWeek: { en: "No clock-in/out yet this week", fr: "Aucun pointage cette semaine" },
    totalThisWeek: { en: "Total this week", fr: "Total cette semaine" },
    previousWeek: { en: "Previous week", fr: "Semaine précédente" },
    nextWeek: { en: "Next week", fr: "Semaine suivante" },
    thisWeek: { en: "This week", fr: "Cette semaine" },
};
