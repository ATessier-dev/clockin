import type { Translation } from "./types";

export const settingsTranslations: Record<string, Translation> = {
    title: { en: "Settings", fr: "Paramètres" },
    codeLabel: { en: "Login code (cannot be changed)", fr: "Code de connexion (non modifiable)" },
    firstNameLabel: { en: "First name", fr: "Prénom" },
    lastNameLabel: { en: "Last name", fr: "Nom" },
    phoneLabel: { en: "Phone", fr: "Téléphone" },
    preferredWorkplaceLabel: { en: "Preferred workplace", fr: "Lieu préféré" },
    availabilityNoteLabel: { en: "Availability note", fr: "Disponibilités" },
    localeLabel: { en: "Language", fr: "Langue" },
    save: { en: "Save", fr: "Enregistrer" },
    saved: { en: "Changes saved.", fr: "Modifications enregistrées." },
    saveError: { en: "Something went wrong, please try again.", fr: "Une erreur est survenue, réessaie." },
};
