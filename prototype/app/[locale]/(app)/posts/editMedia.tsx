"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTranslation, postsTranslations, type Language } from "@/translations";

export type PostMediaEntry = {
  id: string;
  name: string;
};

/**
 * Create/edit form for a post medium (where a text can be posted, e.g.
 * Reddit or LinkedIn). Renders as a create form when `initialValues` is
 * omitted, or an edit form (with delete) otherwise.
 */
export function PostMediaForm({
  language,
  initialValues,
  onCancel,
  onSaved,
  onDeleted,
}: {
  language: Language;
  initialValues?: PostMediaEntry;
  onCancel: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(initialValues);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(false);

    const response = await fetch(isEditing ? `/api/posts/media/${initialValues!.id}` : "/api/posts/media", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
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

    const response = await fetch(`/api/posts/media/${initialValues.id}`, { method: "DELETE" });

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
        <Label htmlFor="post-media-name">{getTranslation(postsTranslations.mediaNameLabel, language)}</Label>
        <Input id="post-media-name" value={name} onChange={(event) => setName(event.target.value)} required autoFocus />
      </div>

      {error && <p className="text-xs text-destructive">{getTranslation(postsTranslations.saveError, language)}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        {isEditing && (
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={submitting}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {getTranslation(postsTranslations.deleteMedia, language)}
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          {getTranslation(postsTranslations.cancel, language)}
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {getTranslation(postsTranslations.save, language)}
        </Button>
      </div>
    </form>
  );
}
