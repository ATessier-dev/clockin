"use client";

import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTranslation, eventsTranslations, type Language } from "@/translations";

export type EventWorkplaceOption = { id: string; label: string };

export type GalleryEventEntry = {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  workplaceId: string | null;
  workplace: { label: string; color: string } | null;
};

const DATETIME_LOCAL_FORMAT = "yyyy-MM-dd'T'HH:mm";

export function galleryEventToFormDefaults(event: GalleryEventEntry) {
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? "",
    startAt: format(event.startAt, DATETIME_LOCAL_FORMAT),
    endAt: format(event.endAt, DATETIME_LOCAL_FORMAT),
    workplaceId: event.workplaceId ?? "",
  };
}

export function GalleryEventForm({
  language,
  workplaces,
  initialValues,
  onCancel,
  onSaved,
  onDeleted,
}: {
  language: Language;
  workplaces: EventWorkplaceOption[];
  initialValues?: ReturnType<typeof galleryEventToFormDefaults>;
  onCancel: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [startAt, setStartAt] = useState(initialValues?.startAt ?? "");
  const [endAt, setEndAt] = useState(initialValues?.endAt ?? "");
  const [workplaceId, setWorkplaceId] = useState(initialValues?.workplaceId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(initialValues);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch(isEditing ? `/api/events/${initialValues!.id}` : "/api/events", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || null,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        workplaceId: workplaceId || null,
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(
        data?.error === "end_before_start"
          ? getTranslation(eventsTranslations.endBeforeStart, language)
          : getTranslation(eventsTranslations.saveError, language)
      );
      return;
    }

    onSaved();
  }

  async function handleDelete() {
    if (!initialValues) return;
    setSubmitting(true);
    setError(null);

    const response = await fetch(`/api/events/${initialValues.id}`, { method: "DELETE" });

    setSubmitting(false);

    if (!response.ok) {
      setError(getTranslation(eventsTranslations.saveError, language));
      return;
    }

    onDeleted();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="space-y-1">
        <Label htmlFor="event-title">{getTranslation(eventsTranslations.titleLabel, language)}</Label>
        <Input id="event-title" value={title} onChange={(event) => setTitle(event.target.value)} required autoFocus />
      </div>

      <div className="space-y-1">
        <Label htmlFor="event-description">{getTranslation(eventsTranslations.descriptionLabel, language)}</Label>
        <Input
          id="event-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="event-start">{getTranslation(eventsTranslations.startAtLabel, language)}</Label>
        <Input
          id="event-start"
          type="datetime-local"
          value={startAt}
          onChange={(event) => setStartAt(event.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="event-end">{getTranslation(eventsTranslations.endAtLabel, language)}</Label>
        <Input
          id="event-end"
          type="datetime-local"
          value={endAt}
          onChange={(event) => setEndAt(event.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="event-workplace">{getTranslation(eventsTranslations.workplaceLabel, language)}</Label>
        <select
          id="event-workplace"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={workplaceId}
          onChange={(event) => setWorkplaceId(event.target.value)}
        >
          <option value="">{getTranslation(eventsTranslations.noWorkplaceOption, language)}</option>
          {workplaces.map((workplace) => (
            <option key={workplace.id} value={workplace.id}>
              {workplace.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        {isEditing && (
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={submitting}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {getTranslation(eventsTranslations.deleteEvent, language)}
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          {getTranslation(eventsTranslations.cancel, language)}
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {getTranslation(eventsTranslations.save, language)}
        </Button>
      </div>
    </form>
  );
}
