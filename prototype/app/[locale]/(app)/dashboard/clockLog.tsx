"use client";

import { useRouter, usePathname } from "next/navigation";
import { format, isSameDay, addWeeks, addDays, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, History, LogIn, LogOut, CalendarCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTranslation, clockTranslations, type Language } from "@/translations";
import { dateLocales } from "../schedule/clockDisplay";
import { computeWorkedMinutes, dayKey, formatDuration } from "@/lib/clock/workedHours";

export type ClockLogEntry = {
  id: string;
  type: "CLOCK_IN" | "CLOCK_OUT";
  at: Date;
  workplace: { label: string; color: string } | null;
};

type DayGroup = { day: Date; entries: ClockLogEntry[] };

// `entries` must already be sorted ascending by `at` — that both groups
// same-day entries together and keeps CLOCK_IN before CLOCK_OUT within a day.
function groupByDay(entries: ClockLogEntry[]): DayGroup[] {
  const groups: DayGroup[] = [];

  for (const entry of entries) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && isSameDay(lastGroup.day, entry.at)) {
      lastGroup.entries.push(entry);
    } else {
      groups.push({ day: entry.at, entries: [entry] });
    }
  }

  return groups.reverse();
}

export function ClockLog({
  language,
  entries,
  weekStartIso,
}: {
  language: Language;
  entries: ClockLogEntry[];
  weekStartIso: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dateLocale = dateLocales[language];
  const dayGroups = groupByDay(entries);
  const { totalMinutes, byDay } = computeWorkedMinutes(entries);
  const weekStart = new Date(weekStartIso);
  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 }));

  function navigateToWeek(offsetWeeks: number) {
    const target = addWeeks(weekStart, offsetWeeks);
    router.push(`${pathname}?week=${encodeURIComponent(target.toISOString())}`);
  }

  function navigateToCurrentWeek() {
    router.push(pathname);
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 sm:justify-between">
          <Button variant="outline" size="sm" onClick={() => navigateToWeek(-1)}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            {getTranslation(clockTranslations.previousWeek, language)}
          </Button>
          <div className="flex flex-col items-center gap-0.5">
            <CardTitle className="flex items-center gap-2 text-sm">
              <History className="h-4 w-4 text-primary" aria-hidden="true" />
              {getTranslation(clockTranslations.weekLog, language)}
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {format(weekStart, "d MMM", { locale: dateLocale })} –{" "}
              {format(weekEnd, "d MMM", { locale: dateLocale })}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigateToWeek(1)}>
            {getTranslation(clockTranslations.nextWeek, language)}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {getTranslation(clockTranslations.totalThisWeek, language)}: {formatDuration(totalMinutes)}
        </p>
        {!isCurrentWeek && (
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={navigateToCurrentWeek}>
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
              {getTranslation(clockTranslations.thisWeek, language)}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {dayGroups.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {getTranslation(clockTranslations.noEventsThisWeek, language)}
          </p>
        ) : (
          dayGroups.map((group) => {
            const dayMinutes = byDay.get(dayKey(group.day));
            return (
              <div key={group.day.toISOString()} className="space-y-1.5 border-b border-border pb-3 last:border-0 last:pb-0">
                <p className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span className="capitalize">{format(group.day, "EEEE d MMM", { locale: dateLocale })}</span>
                  {dayMinutes !== undefined && <span>{formatDuration(dayMinutes)}</span>}
                </p>
                {group.entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-1.5 font-medium">
                      {entry.type === "CLOCK_IN" ? (
                        <LogIn className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      ) : (
                        <LogOut className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                      )}
                      {getTranslation(
                        entry.type === "CLOCK_IN" ? clockTranslations.clockIn : clockTranslations.clockOut,
                        language
                      )}
                    </span>
                    <span className="text-muted-foreground">
                      {format(entry.at, "HH:mm", { locale: dateLocale })}
                    </span>
                    {entry.workplace && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: entry.workplace.color }}
                          aria-hidden="true"
                        />
                        {entry.workplace.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
