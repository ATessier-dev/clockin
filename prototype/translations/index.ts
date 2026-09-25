// Barrel file: re-exports every per-feature translation dictionary plus the
// shared Language/Translation types and the getTranslation lookup helper.
export * from "./login";
export * from "./dashboard";
export * from "./schedule";
export * from "./navbar";
export * from "./clock";
export * from "./timesheets";
export * from "./employees";
export * from "./workplaces";
export * from "./positions";
export * from "./checklist";
export * from "./availability";
export * from "./profile";
export * from "./doc";
export * from "./dailyMeetings";
export * from "./events";
export type { Language, Translation } from "./types";
import type { Language, Translation } from "./types";

export const defaultLanguage: Language = "fr";

/**
 * Looks up the string for the given language in a Translation entry,
 * defaulting to {@link defaultLanguage} when no language is passed.
 * Returns an empty string if the translation itself is undefined.
 */
export function getTranslation(
  translation: Translation | undefined,
  language: Language = defaultLanguage
): string {
  return translation ? translation[language] : "";
}
