"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTranslation, dailyMeetingsTranslations, availabilityTranslations, type Language } from "@/translations";

export type DailyMeetingWorkplaceOption = { id: string; label: string };

export const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export const DAY_SHORT_LABEL_KEY: Record<DayOfWeek, keyof typeof availabilityTranslations> = {
  MONDAY: "mondayShort",
  TUESDAY: "tuesdayShort",
  WEDNESDAY: "wednesdayShort",
  THURSDAY: "thursdayShort",
  FRIDAY: "fridayShort",
  SATURDAY: "saturdayShort",
  SUNDAY: "sundayShort",
};

export type DailyMeetingEntry = {
  id: string;
  name: string;
  time: string;
  days: DayOfWeek[];
  workplaceId: string;
};

/**
 * Create/edit form for a daily meeting. `initialValues` presence selects
 * create (POST) vs edit (PATCH) mode; `days` is kept as a Set for cheap
 * toggling and serialized back to an array on submit.
 */
export function DailyMeetingForm({
  language,
  initialValues,
  workplaces,
  onCancel,
  onSaved,
  onDeleted,
}: {
  language: Language;
  initialValues?: DailyMeetingEntry;
  workplaces: DailyMeetingWorkplaceOption[];
  onCancel: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [time, setTime] = useState(initialValues?.time ?? "09:00");
  const [days, setDays] = useState<Set<DayOfWeek>>(() => new Set(initialValues?.days ?? []));
  const [workplaceId, setWorkplaceId] = useState(initialValues?.workplaceId ?? workplaces[0]?.id ?? "");
  const [error, setError] = useState(false);
  const [noDaysError, setNoDaysError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(initialValues);

  function toggleDay(day: DayOfWeek) {
    setNoDaysError(false);
    setDays((current) => {
      const next = new Set(current);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    // Day selection is a group of toggle buttons, not a native input, so
    // there is no `required` attribute to rely on for this validation.
    if (days.size === 0) {
      setNoDaysError(true);
      return;
    }

    setSubmitting(true);
    setError(false);

    const response = await fetch(
      isEditing ? `/api/daily-meetings/${initialValues!.id}` : "/api/daily-meetings",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, time, days: [...days], workplaceId }),
      }
    );

    setSubmitting(false);

    if (!response.ok) {
      setError(true);
      return;
    }

    onSaved();
  }

  async function handleDelete() {
    if (!initialValues) return;
    setSubmitting(true);
    setError(false);

    const response = await fetch(`/api/daily-meetings/${initialValues.id}`, { method: "DELETE" });

    setSubmitting(false);

    if (!response.ok) {
      setError(true);
      return;
    }

    onDeleted();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="space-y-1">
        <Label htmlFor="daily-meeting-name">{getTranslation(dailyMeetingsTranslations.nameLabel, language)}</Label>
        <Input id="daily-meeting-name" value={name} onChange={(event) => setName(event.target.value)} required autoFocus />
      </div>

      <div className="space-y-1">
        <Label htmlFor="daily-meeting-time">{getTranslation(dailyMeetingsTranslations.timeLabel, language)}</Label>
        <Input
          id="daily-meeting-time"
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <Label>{getTranslation(dailyMeetingsTranslations.daysLabel, language)}</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = days.has(day);
            return (
              <Button
                key={day}
                type="button"
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => toggleDay(day)}
                aria-pressed={isSelected}
              >
                {getTranslation(availabilityTranslations[DAY_SHORT_LABEL_KEY[day]], language)}
              </Button>
            );
          })}
        </div>
        {noDaysError && (
          <p className="text-xs text-destructive">
            {getTranslation(dailyMeetingsTranslations.noDaysError, language)}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="daily-meeting-workplace">
          {getTranslation(dailyMeetingsTranslations.workplaceLabel, language)}
        </Label>
        <select
          id="daily-meeting-workplace"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={workplaceId}
          onChange={(event) => setWorkplaceId(event.target.value)}
          required
        >
          {workplaces.map((workplace) => (
            <option key={workplace.id} value={workplace.id}>
              {workplace.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-xs text-destructive">{getTranslation(dailyMeetingsTranslations.saveError, language)}</p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {isEditing && (
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={submitting}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {getTranslation(dailyMeetingsTranslations.deleteMeeting, language)}
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          {getTranslation(dailyMeetingsTranslations.cancel, language)}
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {getTranslation(dailyMeetingsTranslations.save, language)}
        </Button>
      </div>
    </form>
  );
}
