import type { Translation } from "./types";

export const employeeCardTranslations: Record<string, Translation> = {
    title: {en: 'Personnal informations', fr: 'Informations personnelles'},
    nameLabel : {en: 'Hi', fr: 'Bonjour'},
    idLabel : {en: 'id', fr: 'id'},
    roleLabel : {en: 'role', fr: 'role'}
}

export const upcomingShiftTranslations: Record<string, Translation> = {
    title: { en: "Upcoming shift", fr: "Prochain shift" },
    none: { en: "No upcoming shift scheduled", fr: "Aucun prochain shift prévu" },
}

export const dashboardPageTranslations: Record<string, Translation> = {
    title: { en: "Dashboard", fr: "Tableau de bord" },
}

export const myShiftStatusTranslations: Record<string, Translation> = {
    title: { en: "Should be clocked in", fr: "Devrait être en poste" },
    empty: { en: "No shift scheduled right now", fr: "Aucun shift prévu en ce moment" },
    clockedIn: { en: "Clocked in", fr: "En poste" },
    notClockedIn: { en: "Not clocked in", fr: "Pas encore en poste" },
}