"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { format, isSameDay, addDays, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Pencil, LogIn, LogOut, ClipboardList, CalendarCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageHeading } from "@/components/ui/pageHeading";
import { getTranslation, timesheetsTranslations, clockTranslations, type Language } from "@/translations";
import { dateLocales } from "../schedule/clockDisplay";
import { computeWorkedMinutes, formatDuration } from "@/lib/clock/workedHours";
import { ClockEventForm, clockEventToFormDefaults, type WorkplaceOption } from "./editClockEvent";

export type EmployeeOption = { id: string; firstName: string; lastName: string };

export type ClockEventEntry = {
  id: string;
  type: "CLOCK_IN" | "CLOCK_OUT";
  at: Date;
  note: string | null;
  workplaceId: string | null;
  workplace: { label: string; color: string } | null;
};

export function TimesheetsView({
  language,
  employees,
  workplaces,
  selectedEmployeeId,
  dayStartIso,
  entries,
}: {
  language: Language;
  employees: EmployeeOption[];
  workplaces: WorkplaceOption[];
  selectedEmployeeId: string;
  dayStartIso: string;
  entries: ClockEventEntry[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dateLocale = dateLocales[language];
  const [formMode, setFormMode] = useState<"create" | ClockEventEntry | null>(null);

  // `entries` is already scoped to a single day (see page.tsx), so the total
  // for these entries is the day's total — no per-day grouping needed.
  const { totalMinutes } = computeWorkedMinutes(entries);
  const dayStart = new Date(dayStartIso);
  const isToday = isSameDay(dayStart, startOfDay(new Date()));

  function buildHref(next: { employeeId?: string; day?: string }) {
    const params = new URLSearchParams();
    params.set("employeeId", next.employeeId ?? selectedEmployeeId);
    params.set("day", next.day ?? dayStartIso);
    return `${pathname}?${params.toString()}`;
  }

  function navigateToDay(offsetDays: number) {
    router.push(buildHref({ day: addDays(dayStart, offsetDays).toISOString() }));
  }

  function navigateToToday() {
    router.push(buildHref({ day: startOfDay(new Date()).toISOString() }));
  }

  function handleEmployeeChange(employeeId: string) {
    router.push(buildHref({ employeeId }));
  }

  function handleChanged() {
    setFormMode(null);
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center space-y-4">
      <PageHeading
        className="justify-center text-center"
        title={
          <span className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" aria-hidden="true" />
            {getTranslation(timesheetsTranslations.title, language)}
          </span>
        }
      />

      <div className="flex w-full flex-col items-center gap-3">
        <div className="w-full max-w-xs space-y-1">
          <Label htmlFor="employee-select">
            {getTranslation(timesheetsTranslations.selectEmployee, language)}
          </Label>
          <select
            id="employee-select"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={selectedEmployeeId}
            onChange={(event) => handleEmployeeChange(event.target.value)}
          >
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateToDay(-1)}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            {getTranslation(timesheetsTranslations.previousDay, language)}
          </Button>
          <span className="text-sm capitalize text-muted-foreground">
            {format(dayStart, "EEEE d MMM", { locale: dateLocale })}
          </span>
          <Button variant="outline" size="sm" onClick={() => navigateToDay(1)}>
            {getTranslation(timesheetsTranslations.nextDay, language)}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {!isToday && (
          <Button variant="ghost" size="sm" onClick={navigateToToday}>
            <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            {getTranslation(timesheetsTranslations.today, language)}
          </Button>
        )}

        <Button size="sm" onClick={() => setFormMode("create")} disabled={!selectedEmployeeId}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {getTranslation(timesheetsTranslations.addEvent, language)}
        </Button>
      </div>

      {formMode && selectedEmployeeId && (
        <ClockEventForm
          language={language}
          employeeId={selectedEmployeeId}
          workplaces={workplaces}
          initialValues={formMode === "create" ? undefined : clockEventToFormDefaults(formMode)}
          onCancel={() => setFormMode(null)}
          onSaved={handleChanged}
          onDeleted={handleChanged}
        />
      )}

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm">
            {getTranslation(timesheetsTranslations.totalThisDay, language)}: {formatDuration(totalMinutes)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {getTranslation(timesheetsTranslations.noEventsThisDay, language)}
            </p>
          ) : (
            entries.map((entry) => (
              // Two rows, not one — cramming type + time + workplace + the edit
              // button onto a single line overflows on narrow phone widths.
              <div key={entry.id} className="space-y-1 text-sm">
                <div className="flex items-center justify-between gap-2">
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
                </div>
                <div className="flex items-center justify-between gap-2">
                  {entry.workplace ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: entry.workplace.color }}
                        aria-hidden="true"
                      />
                      {entry.workplace.label}
                    </span>
                  ) : (
                    <span />
                  )}
                  <Button variant="outline" size="sm" onClick={() => setFormMode(entry)}>
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    {getTranslation(timesheetsTranslations.editEvent, language)}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
