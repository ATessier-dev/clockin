import type { Translation } from "./types";

// Strings for the employee management page: list, add/edit form, and
// activate/deactivate actions.
export const employeesTranslations: Record<string, Translation> = {
    title: { en: "Employees", fr: "Employés" },
    addEmployee: { en: "Add an employee", fr: "Ajouter un employé" },
    editEmployee: { en: "Edit", fr: "Modifier" },
    deactivate: { en: "Deactivate", fr: "Désactiver" },
    reactivate: { en: "Reactivate", fr: "Réactiver" },
    inactiveBadge: { en: "Inactive", fr: "Inactif" },
    codeLabel: { en: "Login code", fr: "Code de connexion" },
    firstNameLabel: { en: "First name", fr: "Prénom" },
    lastNameLabel: { en: "Last name", fr: "Nom" },
    roleLabel: { en: "Role", fr: "Rôle" },
    roleEmployee: { en: "Employee", fr: "Employé" },
    roleSuperuser: { en: "Manager", fr: "Superviseur" },
    phoneLabel: { en: "Phone", fr: "Téléphone" },
    preferredWorkplaceLabel: { en: "Preferred workplace", fr: "Lieu préféré" },
    availabilityNoteLabel: { en: "Additional note", fr: "Note additionnelle" },
    cancel: { en: "Cancel", fr: "Annuler" },
    save: { en: "Save", fr: "Enregistrer" },
    saveError: { en: "Something went wrong, please try again.", fr: "Une erreur est survenue, réessaie." },
    codeTaken: { en: "This login code is already in use.", fr: "Ce code de connexion est déjà utilisé." },
};
