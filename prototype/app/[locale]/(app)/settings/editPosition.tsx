"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTranslation, positionsTranslations, type Language } from "@/translations";

export type PositionEntry = {
  id: string;
  name: string;
  color: string;
};

export function PositionForm({
  language,
  initialValues,
  onCancel,
  onSaved,
  onDeleted,
}: {
  language: Language;
  initialValues?: PositionEntry;
  onCancel: () => void;
  onSaved: (position: PositionEntry) => void;
  onDeleted: () => void;
}) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [color, setColor] = useState(initialValues?.color ?? "#0ea5e9");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(initialValues);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(false);

    const response = await fetch(isEditing ? `/api/positions/${initialValues!.id}` : "/api/positions", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError(true);
      return;
    }

    const data = (await response.json()) as { position: PositionEntry };
    onSaved(data.position);
  }

  async function handleDelete() {
    if (!initialValues) return;
    setSubmitting(true);
    setError(false);

    const response = await fetch(`/api/positions/${initialValues.id}`, { method: "DELETE" });

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
        <Label htmlFor="position-name">{getTranslation(positionsTranslations.nameLabel, language)}</Label>
        <Input id="position-name" value={name} onChange={(event) => setName(event.target.value)} required autoFocus />
      </div>

      <div className="space-y-1">
        <Label htmlFor="position-color">{getTranslation(positionsTranslations.colorLabel, language)}</Label>
        <div className="flex items-center gap-2">
          <input
            id="position-color"
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

      {error && <p className="text-xs text-destructive">{getTranslation(positionsTranslations.saveError, language)}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        {isEditing && (
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={submitting}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {getTranslation(positionsTranslations.deletePosition, language)}
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          {getTranslation(positionsTranslations.cancel, language)}
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {getTranslation(positionsTranslations.save, language)}
        </Button>
      </div>
    </form>
  );
}
