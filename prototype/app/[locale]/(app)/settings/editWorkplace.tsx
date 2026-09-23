"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTranslation, workplacesTranslations, type Language } from "@/translations";

export type WorkplaceEntry = {
  id: string;
  label: string;
  description: string | null;
  color: string;
};

export function WorkplaceForm({
  language,
  initialValues,
  onCancel,
  onSaved,
}: {
  language: Language;
  initialValues?: WorkplaceEntry;
  onCancel: () => void;
  onSaved: (workplace: WorkplaceEntry) => void;
}) {
  const [label, setLabel] = useState(initialValues?.label ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [color, setColor] = useState(initialValues?.color ?? "#0ea5e9");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(initialValues);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch(isEditing ? `/api/workplaces/${initialValues!.id}` : "/api/workplaces", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, description: description || null, color }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError(getTranslation(workplacesTranslations.saveError, language));
      return;
    }

    const data = (await response.json()) as { workplace: WorkplaceEntry };
    onSaved(data.workplace);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="space-y-1">
        <Label htmlFor="workplace-label">{getTranslation(workplacesTranslations.labelLabel, language)}</Label>
        <Input id="workplace-label" value={label} onChange={(event) => setLabel(event.target.value)} required />
      </div>

      <div className="space-y-1">
        <Label htmlFor="workplace-description">
          {getTranslation(workplacesTranslations.descriptionLabel, language)}
        </Label>
        <Input
          id="workplace-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="workplace-color">{getTranslation(workplacesTranslations.colorLabel, language)}</Label>
        <div className="flex items-center gap-2">
          <input
            id="workplace-color"
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background p-1"
          />
          <Input
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="font-mono"
            maxLength={7}
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          {getTranslation(workplacesTranslations.cancel, language)}
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {getTranslation(workplacesTranslations.save, language)}
        </Button>
      </div>
    </form>
  );
}
