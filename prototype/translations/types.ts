/** Supported UI locale codes. */
export type Language = "en" | "fr";

/** A translated string, with one entry required per supported {@link Language}. */
export type Translation = Record<Language, string>;
