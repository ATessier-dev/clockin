import type { Translation } from "./types";

// Strings for the main navigation bar: links, greeting, and actions
// (logout, language switch).
export const navbarTranslations: Record<string, Translation> = {
    greetings: {en: 'Hi', fr: 'Bonjour'},
    dashboard: { en: "Dashboard", fr: "Tableau de bord" },
    schedule: { en: "Schedule", fr: "Planning" },
    checklist: { en: "Checklist", fr: "Liste de tâches" },
    posts: { en: "Posts", fr: "Publications" },
    profil: { en: "Profile", fr: "Profil" },
    settings: { en: "Settings", fr: "Paramètres" },
    doc: { en: "Docs", fr: "Docs" },
    timesheets: { en: "Timesheets", fr: "Feuilles de temps" },
    employees: { en: "Employees", fr: "Employés" },
    logout: { en: "Log out", fr: "Déconnexion" },
    switchLanguage: { en: "Switch language", fr: "Changer de langue" },
};
