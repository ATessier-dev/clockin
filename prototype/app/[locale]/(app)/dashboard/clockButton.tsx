"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { LogIn, LogOut, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTranslation, clockTranslations, type Language } from "@/translations";
import { dateLocales } from "../schedule/clockDisplay";

export function ClockButton({
  language,
  isClockedIn,
  since,
}: {
  language: Language;
  isClockedIn: boolean;
  since: Date | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dateLocale = dateLocales[language];

  async function handleClick() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/clock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: isClockedIn ? "CLOCK_OUT" : "CLOCK_IN" }),
    });

    setLoading(false);

    if (!response.ok) {
      setError(getTranslation(clockTranslations.genericError, language));
      return;
    }

    router.refresh();
  }

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircleDot
            className={isClockedIn ? "h-3 w-3 text-primary" : "h-3 w-3 text-muted-foreground/50"}
            aria-hidden="true"
          />
          {isClockedIn && since ? (
            <span>
              {getTranslation(clockTranslations.clockedInSince, language)}{" "}
              {format(since, "HH:mm", { locale: dateLocale })}
            </span>
          ) : (
            <span>{getTranslation(clockTranslations.notClockedIn, language)}</span>
          )}
        </div>

        <Button variant={isClockedIn ? "destructive" : "default"} size="lg" onClick={handleClick} disabled={loading}>
          {isClockedIn ? (
            <LogOut className="h-4 w-4" aria-hidden="true" />
          ) : (
            <LogIn className="h-4 w-4" aria-hidden="true" />
          )}
          {getTranslation(isClockedIn ? clockTranslations.clockOut : clockTranslations.clockIn, language)}
        </Button>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
