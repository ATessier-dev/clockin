import type { Translation } from "./types";

// Strings for the employee profile page (personal info and preferences).
export const profileTranslations: Record<string, Translation> = {
    title: { en: "Profile", fr: "Profil" },
    codeLabel: { en: "Login code (cannot be changed)", fr: "Code de connexion (non modifiable)" },
    firstNameLabel: { en: "First name", fr: "Prénom" },
    lastNameLabel: { en: "Last name", fr: "Nom" },
    phoneLabel: { en: "Phone", fr: "Téléphone" },
    preferredPositionLabel: { en: "Preferred position", fr: "Poste préféré" },
    availabilityNoteLabel: { en: "Additional note", fr: "Note additionnelle" },
    localeLabel: { en: "Language", fr: "Langue" },
    save: { en: "Save", fr: "Enregistrer" },
    saved: { en: "Changes saved.", fr: "Modifications enregistrées." },
    saveError: { en: "Something went wrong, please try again.", fr: "Une erreur est survenue, réessaie." },
};
