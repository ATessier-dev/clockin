"use client";

import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslation, availabilityTranslations, type Language } from "@/translations";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;
type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

const DAY_SHORT_LABEL_KEY: Record<DayOfWeek, keyof typeof availabilityTranslations> = {
  MONDAY: "mondayShort",
  TUESDAY: "tuesdayShort",
  WEDNESDAY: "wednesdayShort",
  THURSDAY: "thursdayShort",
  FRIDAY: "fridayShort",
  SATURDAY: "saturdayShort",
  SUNDAY: "sundayShort",
};

export type TeamAvailabilityEmployee = { id: string; firstName: string; lastName: string };
export type TeamAvailabilityWorkplace = { id: string; color: string };
export type TeamAvailabilityEntry = { employeeId: string; dayOfWeek: DayOfWeek; workplaceId: string };

export function TeamAvailabilityPanel({
  language,
  employees,
  workplaces,
  availabilities,
  className,
}: {
  language: Language;
  employees: TeamAvailabilityEmployee[];
  workplaces: TeamAvailabilityWorkplace[];
  availabilities: TeamAvailabilityEntry[];
  className?: string;
}) {
  const workplaceColor = (workplaceId: string) => workplaces.find((w) => w.id === workplaceId)?.color ?? "#94a3b8";

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
          {getTranslation(availabilityTranslations.teamTitle, language)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {employees.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {getTranslation(availabilityTranslations.teamEmpty, language)}
          </p>
        ) : (
          employees.map((employee) => {
            const employeeAvailabilities = availabilities.filter((a) => a.employeeId === employee.id);
            return (
              <div key={employee.id} className="space-y-1.5">
                <p className="text-sm font-medium">
                  {employee.firstName} {employee.lastName}
                </p>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS_OF_WEEK.map((day) => {
                    const dayEntries = employeeAvailabilities.filter((a) => a.dayOfWeek === day);
                    return (
                      <div key={day} className="flex flex-col items-center gap-1">
                        <span className="text-[10px] uppercase text-muted-foreground">
                          {getTranslation(availabilityTranslations[DAY_SHORT_LABEL_KEY[day]], language)}
                        </span>
                        <div className="flex min-h-[6px] items-center gap-0.5">
                          {dayEntries.length === 0 ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-muted" aria-hidden="true" />
                          ) : (
                            dayEntries.map((entry) => (
                              <span
                                key={entry.workplaceId}
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: workplaceColor(entry.workplaceId) }}
                                aria-hidden="true"
                              />
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
