export * from "./login";
export * from "./dashboard";
export * from "./schedule";
export * from "./navbar";
export * from "./clock";
export * from "./timesheets";
export * from "./employees";
export * from "./settings";
export * from "./workplaces";
export * from "./checklist";
export * from "./availability";
export type { Language, Translation } from "./types";
import type { Language, Translation } from "./types";

export const defaultLanguage: Language = "fr";

export function getTranslation(
  translation: Translation | undefined,
  language: Language = defaultLanguage
): string {
  return translation ? translation[language] : "";
}
