"use client";

import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTranslation, timesheetsTranslations, clockTranslations, type Language } from "@/translations";
import type { ClockEventEntry } from "./timesheetsView";

export type WorkplaceOption = { id: string; label: string };

const DATETIME_LOCAL_FORMAT = "yyyy-MM-dd'T'HH:mm";

export function clockEventToFormDefaults(entry: ClockEventEntry) {
  return {
    id: entry.id,
    type: entry.type,
    at: format(entry.at, DATETIME_LOCAL_FORMAT),
    workplaceId: entry.workplaceId ?? "",
    note: entry.note ?? "",
  };
}

export function ClockEventForm({
  language,
  employeeId,
  workplaces,
  initialValues,
  onCancel,
  onSaved,
  onDeleted,
}: {
  language: Language;
  employeeId: string;
  workplaces: WorkplaceOption[];
  initialValues?: ReturnType<typeof clockEventToFormDefaults>;
  onCancel: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [type, setType] = useState<"CLOCK_IN" | "CLOCK_OUT">(initialValues?.type ?? "CLOCK_IN");
  const [at, setAt] = useState(initialValues?.at ?? "");
  const [workplaceId, setWorkplaceId] = useState(initialValues?.workplaceId ?? "");
  const [note, setNote] = useState(initialValues?.note ?? "");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(initialValues);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(false);

    const response = await fetch(isEditing ? `/api/clock-events/${initialValues!.id}` : "/api/clock-events", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId,
        type,
        at: new Date(at).toISOString(),
        workplaceId: workplaceId || null,
        note: note || null,
      }),
    });

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

    const response = await fetch(`/api/clock-events/${initialValues.id}`, { method: "DELETE" });

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
        <Label htmlFor="event-type">{getTranslation(timesheetsTranslations.typeLabel, language)}</Label>
        <select
          id="event-type"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={type}
          onChange={(event) => setType(event.target.value as "CLOCK_IN" | "CLOCK_OUT")}
        >
          <option value="CLOCK_IN">{getTranslation(clockTranslations.clockIn, language)}</option>
          <option value="CLOCK_OUT">{getTranslation(clockTranslations.clockOut, language)}</option>
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="event-at">{getTranslation(timesheetsTranslations.atLabel, language)}</Label>
        <Input
          id="event-at"
          type="datetime-local"
          value={at}
          onChange={(event) => setAt(event.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="event-workplace">{getTranslation(timesheetsTranslations.workplaceLabel, language)}</Label>
        <select
          id="event-workplace"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={workplaceId}
          onChange={(event) => setWorkplaceId(event.target.value)}
        >
          <option value="">—</option>
          {workplaces.map((workplace) => (
            <option key={workplace.id} value={workplace.id}>
              {workplace.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="event-note">{getTranslation(timesheetsTranslations.noteLabel, language)}</Label>
        <Input id="event-note" value={note} onChange={(event) => setNote(event.target.value)} />
      </div>

      {error && (
        <p className="text-xs text-destructive">{getTranslation(timesheetsTranslations.saveError, language)}</p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {isEditing && (
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={submitting}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {getTranslation(timesheetsTranslations.deleteEvent, language)}
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          {getTranslation(timesheetsTranslations.cancel, language)}
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {getTranslation(timesheetsTranslations.save, language)}
        </Button>
      </div>
    </form>
  );
}
