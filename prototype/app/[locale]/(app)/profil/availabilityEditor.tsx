"use client";

import { useState } from "react";
import { CalendarClock, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTranslation, availabilityTranslations, type Language } from "@/translations";

export type AvailabilityWorkplace = { id: string; label: string; color: string };
export type AvailabilityEntry = { dayOfWeek: DayOfWeek; workplaceId: string };

const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

const DAY_LABEL_KEY: Record<DayOfWeek, keyof typeof availabilityTranslations> = {
  MONDAY: "monday",
  TUESDAY: "tuesday",
  WEDNESDAY: "wednesday",
  THURSDAY: "thursday",
  FRIDAY: "friday",
  SATURDAY: "saturday",
  SUNDAY: "sunday",
};

function toKey(dayOfWeek: DayOfWeek, workplaceId: string): string {
  return `${dayOfWeek}:${workplaceId}`;
}

export function AvailabilityEditor({
  language,
  employeeId,
  workplaces,
  initialAvailabilities,
}: {
  language: Language;
  employeeId: string;
  workplaces: AvailabilityWorkplace[];
  initialAvailabilities: AvailabilityEntry[];
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialAvailabilities.map((a) => toKey(a.dayOfWeek, a.workplaceId)))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(dayOfWeek: DayOfWeek, workplaceId: string) {
    setSaved(false);
    const key = toKey(dayOfWeek, workplaceId);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function handleSave() {
    setSubmitting(true);
    setError(false);
    setSaved(false);

    const availabilities: AvailabilityEntry[] = [...selected].map((key) => {
      const [dayOfWeek, workplaceId] = key.split(":") as [DayOfWeek, string];
      return { dayOfWeek, workplaceId };
    });

    const response = await fetch(`/api/employees/${employeeId}/availability`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availabilities }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError(true);
      return;
    }

    setSaved(true);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
          {getTranslation(availabilityTranslations.title, language)}
        </CardTitle>
        <CardDescription>{getTranslation(availabilityTranslations.description, language)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {workplaces.length === 0 ? (
          <p className="text-xs text-muted-foreground">{getTranslation(availabilityTranslations.empty, language)}</p>
        ) : (
          <div className="space-y-3">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="space-y-1.5">
                <p className="flex items-baseline gap-2 text-xs font-semibold text-muted-foreground">
                  {getTranslation(availabilityTranslations[DAY_LABEL_KEY[day]], language)}
                  <span className="font-normal">{getTranslation(availabilityTranslations.hours, language)}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {workplaces.map((workplace) => {
                    const isSelected = selected.has(toKey(day, workplace.id));
                    return (
                      <Button
                        key={workplace.id}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggle(day, workplace.id)}
                        aria-pressed={isSelected}
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: isSelected ? undefined : workplace.color }}
                          aria-hidden="true"
                        />
                        {workplace.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive">{getTranslation(availabilityTranslations.saveError, language)}</p>
        )}
        {saved && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            {getTranslation(availabilityTranslations.saved, language)}
          </p>
        )}

        <Button type="button" size="sm" onClick={handleSave} disabled={submitting || workplaces.length === 0}>
          {getTranslation(availabilityTranslations.save, language)}
        </Button>
      </CardContent>
    </Card>
  );
}
