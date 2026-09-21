import type { Translation } from "./types";

export const workplacesTranslations: Record<string, Translation> = {
    title: { en: "Workplaces", fr: "Lieux de travail" },
    addWorkplace: { en: "Add a workplace", fr: "Ajouter un lieu" },
    editWorkplace: { en: "Edit", fr: "Modifier" },
    keyLabel: { en: "Key (unique id)", fr: "Clé (identifiant unique)" },
    labelLabel: { en: "Name", fr: "Nom" },
    allowedCidrLabel: { en: "Allowed network (CIDR)", fr: "Réseau autorisé (CIDR)" },
    colorLabel: { en: "Color", fr: "Couleur" },
    cancel: { en: "Cancel", fr: "Annuler" },
    save: { en: "Save", fr: "Enregistrer" },
    saveError: { en: "Something went wrong, please try again.", fr: "Une erreur est survenue, réessaie." },
    keyTaken: { en: "This key is already in use.", fr: "Cette clé est déjà utilisée." },
};
