"use client";

import { useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getTranslation, navbarTranslations, type Language } from "@/translations";

const otherLocale: Record<Language, Language> = { fr: "en", en: "fr" };

/**
 * Toggles the UI language between fr/en by re-navigating to the current
 * route under the other locale prefix.
 */
export function LanguageSwitcher({ language }: { language: Language }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nextLocale = otherLocale[language];

  function handleSwitch() {
    // Forward the current query string so switching language doesn't drop
    // state like the selected schedule week.
    router.replace({ pathname, query: Object.fromEntries(searchParams) }, { locale: nextLocale });
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSwitch}
      aria-label={getTranslation(navbarTranslations.switchLanguage, language)}
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      <span className="uppercase">{nextLocale}</span>
    </Button>
  );
}
