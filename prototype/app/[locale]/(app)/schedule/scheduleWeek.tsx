"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useLayoutEffect, useRef, type FormEvent } from "react";
import { format, isSameDay, addWeeks, startOfWeek } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  User,
  CalendarDays,
  Pencil,
  CalendarCheck,
  Copy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeading } from "@/components/ui/pageHeading";
import { getTranslation, scheduleCalendarTranslations, type Language } from "@/translations";
import { ShiftDisplay, type ShiftListItem } from "./shiftDisplay";
import {
  ShiftForm,
  shiftToFormDefaults,
  type EmployeeOption,
  type WorkplaceOption,
  type PositionOption,
} from "./editSchedule";
import { dateLocales } from "./clockDisplay";
import { TeamAvailabilityPanel, type TeamAvailabilityEntry } from "./teamAvailability";

type RawShift = {
  id: string;
  employeeId: string;
  workplaceId: string;
  positionId: string | null;
  startAt: string;
  endAt: string;
  employee: { firstName: string; lastName: string };
  workplace: { label: string; color: string } | null;
  position: { name: string; color: string } | null;
};

function toShiftListItem(raw: RawShift): ShiftListItem {
  return {
    id: raw.id,
    employeeId: raw.employeeId,
    workplaceId: raw.workplaceId,
    positionId: raw.positionId,
    employee: raw.employee,
    workplace: raw.workplace,
    position: raw.position,
    startAt: new Date(raw.startAt),
    endAt: new Date(raw.endAt),
  };
}

export function ScheduleWeek({
  language,
  weekDays,
  weekStartIso,
  weekEndIso,
  myShifts,
  isSuperuser,
  employees,
  workplaces,
  positions,
  teamAvailabilities,
}: {
  language: Language;
  weekDays: Date[];
  weekStartIso: string;
  weekEndIso: string;
  myShifts: ShiftListItem[];
  isSuperuser: boolean;
  employees: EmployeeOption[];
  workplaces: WorkplaceOption[];
  positions: PositionOption[];
  teamAvailabilities: TeamAvailabilityEntry[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [showAll, setShowAll] = useState(false);
  const [allShifts, setAllShifts] = useState<ShiftListItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [formMode, setFormMode] = useState<"create" | ShiftListItem | null>(null);
  const [prefillDate, setPrefillDate] = useState<Date | null>(null);
  const [copyMode, setCopyMode] = useState(false);
  const [copyTargetDate, setCopyTargetDate] = useState("");
  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const dateLocale = dateLocales[language];
  const shiftsToShow = showAll ? (allShifts ?? []) : myShifts;
  const isCurrentWeek = isSameDay(
    new Date(weekStartIso),
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const todayCardRef = useRef<HTMLDivElement>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);

  // Bring today's card into view when the week (re)renders — e.g. landing
  // on the page, or navigating back to the current week.
  useEffect(() => {
    todayCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // Bring the shift form into view and focus it whenever it opens — whether
  // it's the generic "Ajouter" button, a day's quick-add "+", or "Modifier".
  // useLayoutEffect (not useEffect) so this runs before the browser paints —
  // and `preventScroll` on focus() keeps it from fighting our own smooth
  // scrollIntoView with a competing native jump-scroll.
  useLayoutEffect(() => {
    if (!formMode) return;
    const container = formContainerRef.current;
    if (!container) return;
    const field = container.querySelector<HTMLElement>("input, select, textarea");
    field?.focus({ preventScroll: true });
    container.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [formMode, prefillDate]);

  async function fetchAllShifts() {
    setLoading(true);
    const response = await fetch(
      `/api/shifts?startAtFrom=${encodeURIComponent(weekStartIso)}&startAtTo=${encodeURIComponent(weekEndIso)}`
    );
    const data = (await response.json()) as { shifts?: RawShift[] };
    setAllShifts((data.shifts ?? []).map(toShiftListItem));
    setLoading(false);
  }

  function navigateToWeek(offsetWeeks: number) {
    const target = addWeeks(new Date(weekStartIso), offsetWeeks);
    router.push(`${pathname}?week=${encodeURIComponent(target.toISOString())}`);
  }

  function navigateToCurrentWeek() {
    router.push(pathname);
  }

  function handleShowMine() {
    setShowAll(false);
  }

  async function handleShowAll() {
    if (allShifts === null) {
      await fetchAllShifts();
    }
    setShowAll(true);
  }

  function handleAddForDay(day: Date) {
    setPrefillDate(day);
    setFormMode("create");
  }

  async function handleCopyWeek(event: FormEvent) {
    event.preventDefault();
    if (!copyTargetDate) return;

    setCopying(true);
    setCopyError(null);

    const targetWeekStart = startOfWeek(new Date(copyTargetDate), { weekStartsOn: 1 });

    const response = await fetch("/api/shifts/copy-week", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceWeekStart: weekStartIso,
        targetWeekStart: targetWeekStart.toISOString(),
      }),
    });

    setCopying(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setCopyError(
        data?.error === "same_week"
          ? getTranslation(scheduleCalendarTranslations.copyWeekSameWeek, language)
          : getTranslation(scheduleCalendarTranslations.copyWeekError, language)
      );
      return;
    }

    setCopyMode(false);
    setCopyTargetDate("");
    router.push(`${pathname}?week=${encodeURIComponent(targetWeekStart.toISOString())}`);
  }

  function handleChanged() {
    const wasCreating = formMode === "create";
    setFormMode(null);
    setPrefillDate(null);
    router.refresh();
    if (wasCreating) {
      // A newly added shift may belong to another employee — switch to the
      // "all shifts" view so it's guaranteed to show up immediately.
      setShowAll(true);
      void fetchAllShifts();
    } else if (showAll) {
      void fetchAllShifts();
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div
        className={
          isSuperuser
            ? "flex flex-col gap-6 lg:grid lg:grid-cols-[18rem_1fr_18rem] lg:items-start lg:gap-6"
            : undefined
        }
      >
        {isSuperuser && (
          <TeamAvailabilityPanel
            language={language}
            employees={employees}
            workplaces={workplaces}
            availabilities={teamAvailabilities}
          />
        )}
        <div className="mx-auto flex w-full max-w-md flex-col items-center space-y-4">
          <PageHeading
            className="justify-center text-center"
            title={
              <span className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
                {getTranslation(scheduleCalendarTranslations.week, language)}
              </span>
            }
          />

          <div className="flex w-full flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => navigateToWeek(-1)}>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                {getTranslation(scheduleCalendarTranslations.previousWeek, language)}
              </Button>
              <span className="text-sm text-muted-foreground">
                {format(weekDays[0], "d MMM", { locale: dateLocale })} –{" "}
                {format(weekDays[weekDays.length - 1], "d MMM", { locale: dateLocale })}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateToWeek(1)}>
                {getTranslation(scheduleCalendarTranslations.nextWeek, language)}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            {!isCurrentWeek && (
              <Button variant="ghost" size="sm" onClick={navigateToCurrentWeek}>
                <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                {getTranslation(scheduleCalendarTranslations.thisWeek, language)}
              </Button>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              <div className="inline-flex overflow-hidden rounded-md border border-input">
                <Button
                  type="button"
                  variant={showAll ? "ghost" : "default"}
                  size="sm"
                  className="rounded-none border-0"
                  onClick={handleShowMine}
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  {getTranslation(scheduleCalendarTranslations.showMyShifts, language)}
                </Button>
                <Button
                  type="button"
                  variant={showAll ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none border-0 border-l border-input"
                  onClick={handleShowAll}
                  disabled={loading}
                >
                  <Users className="h-4 w-4" aria-hidden="true" />
                  {loading
                    ? getTranslation(scheduleCalendarTranslations.loading, language)
                    : getTranslation(scheduleCalendarTranslations.showAllShifts, language)}
                </Button>
              </div>
              {isSuperuser && (
                <Button
                  size="sm"
                  onClick={() => {
                    setPrefillDate(null);
                    setFormMode("create");
                  }}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {getTranslation(scheduleCalendarTranslations.addShift, language)}
                </Button>
              )}
              {isSuperuser && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCopyMode((current) => !current)}
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  {getTranslation(scheduleCalendarTranslations.copyWeek, language)}
                </Button>
              )}
            </div>
          </div>

          {isSuperuser && copyMode && (
            <form
              onSubmit={handleCopyWeek}
              className="w-full space-y-3 rounded-lg border border-border bg-card p-4"
            >
              <div className="space-y-1">
                <Label htmlFor="copy-week-target">
                  {getTranslation(scheduleCalendarTranslations.copyWeekTargetLabel, language)}
                </Label>
                <Input
                  id="copy-week-target"
                  type="date"
                  value={copyTargetDate}
                  onChange={(event) => setCopyTargetDate(event.target.value)}
                  required
                />
              </div>

              {copyError && <p className="text-xs text-destructive">{copyError}</p>}

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCopyMode(false)}
                  disabled={copying}
                >
                  {getTranslation(scheduleCalendarTranslations.cancel, language)}
                </Button>
                <Button type="submit" size="sm" disabled={copying}>
                  {getTranslation(scheduleCalendarTranslations.copyWeekConfirm, language)}
                </Button>
              </div>
            </form>
          )}

          {/* Only the generic "Ajouter un shift" button (no specific day) shows
          its form here, above the day list. Quick-add from a day's "+" and
          "Modifier" on an existing shift both render inline, right below
          that day's card, instead (see the day list below). */}
          {isSuperuser && formMode === "create" && !prefillDate && (
            <div ref={formContainerRef} className="w-full">
              <ShiftForm
                language={language}
                employees={employees}
                workplaces={workplaces}
                positions={positions}
                onCancel={() => {
                  setFormMode(null);
                  setPrefillDate(null);
                }}
                onSaved={handleChanged}
                onDeleted={handleChanged}
              />
            </div>
          )}

          <div className="flex w-full flex-col items-center gap-3">
            {weekDays.map((day) => {
              const dayShifts = shiftsToShow.filter((shift) => isSameDay(shift.startAt, day));
              const isToday = isSameDay(day, new Date());
              const isQuickAddForThisDay =
                isSuperuser && formMode === "create" && prefillDate && isSameDay(day, prefillDate);
              const isEditingThisDay =
                isSuperuser &&
                formMode !== null &&
                formMode !== "create" &&
                isSameDay(formMode.startAt, day);
              return (
                <div key={day.toISOString()} className="w-full space-y-3">
                  <Card
                    ref={isToday ? todayCardRef : undefined}
                    className={isToday ? "w-full border-primary/50 shadow-md" : "w-full"}
                  >
                    <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                      <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm capitalize">
                        {format(day, "EEEE d MMM", { locale: dateLocale })}
                        {isToday && (
                          <Badge variant="default" className="normal-case">
                            {getTranslation(scheduleCalendarTranslations.today, language)}
                          </Badge>
                        )}
                      </CardTitle>
                      {isSuperuser && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => handleAddForDay(day)}
                          aria-label={getTranslation(
                            scheduleCalendarTranslations.addShift,
                            language
                          )}
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-2 text-center">
                      {dayShifts.length > 0 ? (
                        <ShiftDisplay
                          shiftList={dayShifts}
                          renderActions={
                            isSuperuser
                              ? (shift) => (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFormMode(shift)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                    {getTranslation(
                                      scheduleCalendarTranslations.editShift,
                                      language
                                    )}
                                  </Button>
                                )
                              : undefined
                          }
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {getTranslation(scheduleCalendarTranslations.noShifts, language)}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {(isQuickAddForThisDay || isEditingThisDay) && (
                    <div ref={formContainerRef} className="w-full">
                      <ShiftForm
                        language={language}
                        employees={employees}
                        workplaces={workplaces}
                        positions={positions}
                        initialValues={
                          isEditingThisDay
                            ? shiftToFormDefaults(formMode as ShiftListItem)
                            : undefined
                        }
                        initialDate={isQuickAddForThisDay ? (prefillDate ?? undefined) : undefined}
                        onCancel={() => {
                          setFormMode(null);
                          setPrefillDate(null);
                        }}
                        onSaved={handleChanged}
                        onDeleted={handleChanged}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {isSuperuser && <div aria-hidden="true" className="hidden lg:block" />}
      </div>
    </div>
  );
}
