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

export function getTranslation(
  translation: Translation | undefined,
  language: Language = defaultLanguage
): string {
  return translation ? translation[language] : "";
}
