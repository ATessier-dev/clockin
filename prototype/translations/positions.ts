import type { Translation } from "./types";

export const positionsTranslations: Record<string, Translation> = {
    title: { en: "Positions", fr: "Postes" },
    addPosition: { en: "Add a position", fr: "Ajouter un poste" },
    editPosition: { en: "Edit", fr: "Modifier" },
    deletePosition: { en: "Delete", fr: "Supprimer" },
    nameLabel: { en: "Name", fr: "Nom" },
    colorLabel: { en: "Color", fr: "Couleur" },
    cancel: { en: "Cancel", fr: "Annuler" },
    save: { en: "Save", fr: "Enregistrer" },
    saveError: { en: "Something went wrong, please try again.", fr: "Une erreur est survenue, réessaie." },
    empty: { en: "No positions yet", fr: "Aucun poste pour le moment" },
};
