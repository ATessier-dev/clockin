"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTranslation, docTranslations, type Language } from "@/translations";
import type { DocCategoryEntry } from "./editDocCategory";

export type DocLinkEntry = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  categoryId: string | null;
};

/**
 * Create/edit form for a documentation link (title, URL, optional
 * description, category). Renders as a create form when `initialValues`
 * is omitted, or an edit form (with delete) otherwise.
 */
export function DocLinkForm({
  language,
  initialValues,
  categories,
  onCancel,
  onSaved,
  onDeleted,
}: {
  language: Language;
  initialValues?: DocLinkEntry;
  categories: DocCategoryEntry[];
  onCancel: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [url, setUrl] = useState(initialValues?.url ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? "");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(initialValues);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(false);

    const response = await fetch(isEditing ? `/api/doc/links/${initialValues!.id}` : "/api/doc/links", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, url, description: description || null, categoryId: categoryId || null }),
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

    const response = await fetch(`/api/doc/links/${initialValues.id}`, { method: "DELETE" });

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
        <Label htmlFor="doc-link-title">{getTranslation(docTranslations.titleLabel, language)}</Label>
        <Input id="doc-link-title" value={title} onChange={(event) => setTitle(event.target.value)} required autoFocus />
      </div>

      <div className="space-y-1">
        <Label htmlFor="doc-link-url">{getTranslation(docTranslations.urlLabel, language)}</Label>
        <Input
          id="doc-link-url"
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://..."
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="doc-link-description">
          {getTranslation(docTranslations.descriptionLabel, language)}
        </Label>
        <Input
          id="doc-link-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="doc-link-category">{getTranslation(docTranslations.categoryLabel, language)}</Label>
        <select
          id="doc-link-category"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="">{getTranslation(docTranslations.noCategoryOption, language)}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-xs text-destructive">{getTranslation(docTranslations.saveError, language)}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        {isEditing && (
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={submitting}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {getTranslation(docTranslations.deleteLink, language)}
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          {getTranslation(docTranslations.cancel, language)}
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {getTranslation(docTranslations.save, language)}
        </Button>
      </div>
    </form>
  );
}
