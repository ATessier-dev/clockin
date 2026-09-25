"use client";
import { useLocale } from "next-intl";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import type { Language } from "@/translations/types";

export const dateLocales: Record<Language, typeof fr> = { fr, en: enUS };

/**
 * Renders the current time. Note this is a single render-time snapshot, not
 * a live clock — it only updates when the component re-renders for another reason.
 */
export function ClockDisplay() {
  const locale = useLocale() as Language; // pas de await ici
  return <span>{format(new Date(), "HH:mm", { locale: dateLocales[locale] })}</span>;
}
