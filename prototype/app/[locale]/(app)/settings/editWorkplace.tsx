"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTranslation, workplacesTranslations, type Language } from "@/translations";

export type WorkplaceEntry = {
  id: string;
  key: string;
  label: string;
  allowedCidr: string;
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
  const [key, setKey] = useState(initialValues?.key ?? "");
  const [label, setLabel] = useState(initialValues?.label ?? "");
  const [allowedCidr, setAllowedCidr] = useState(initialValues?.allowedCidr ?? "");
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
      body: JSON.stringify({ key, label, allowedCidr, color }),
    });

    setSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(
        data?.error === "key_taken"
          ? getTranslation(workplacesTranslations.keyTaken, language)
          : getTranslation(workplacesTranslations.saveError, language)
      );
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
        <Label htmlFor="workplace-key">{getTranslation(workplacesTranslations.keyLabel, language)}</Label>
        <Input id="workplace-key" value={key} onChange={(event) => setKey(event.target.value)} required />
      </div>

      <div className="space-y-1">
        <Label htmlFor="workplace-cidr">{getTranslation(workplacesTranslations.allowedCidrLabel, language)}</Label>
        <Input
          id="workplace-cidr"
          value={allowedCidr}
          onChange={(event) => setAllowedCidr(event.target.value)}
          placeholder="192.168.1.0/24"
          required
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
