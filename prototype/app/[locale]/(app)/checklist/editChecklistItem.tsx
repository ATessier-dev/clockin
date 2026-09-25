"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTranslation, checklistTranslations, type Language } from "@/translations";
import type { ChecklistRecurrence } from "@/lib/checklist/effectiveCompletion";

export type ChecklistItemEntry = {
  id: string;
  label: string;
  recurrence: ChecklistRecurrence;
  completed: boolean;
  categoryId: string | null;
  completedByEmployee: { id: string; firstName: string; lastName: string } | null;
};

export type ChecklistCategoryEntry = {
  id: string;
  name: string;
};

export const RECURRENCE_TRANSLATION_KEY = {
  ONE_TIME: "recurrenceOneTime",
  DAILY: "recurrenceDaily",
  WEEKLY: "recurrenceWeekly",
  MONTHLY: "recurrenceMonthly",
} as const;

/**
 * Create/edit form for a checklist item (label, recurrence, category).
 * Renders as a create form when `initialValues` is omitted, or an edit
 * form (with delete) otherwise.
 */
export function ChecklistItemForm({
  language,
  initialValues,
  categories,
  onCancel,
  onSaved,
  onDeleted,
}: {
  language: Language;
  initialValues?: ChecklistItemEntry;
  categories: ChecklistCategoryEntry[];
  onCancel: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [label, setLabel] = useState(initialValues?.label ?? "");
  const [recurrence, setRecurrence] = useState<ChecklistRecurrence>(initialValues?.recurrence ?? "ONE_TIME");
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? "");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(initialValues);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(false);

    const response = await fetch(isEditing ? `/api/checklist/${initialValues!.id}` : "/api/checklist", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, recurrence, categoryId: categoryId || null }),
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

    const response = await fetch(`/api/checklist/${initialValues.id}`, { method: "DELETE" });

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
        <Label htmlFor="checklist-item-label">{getTranslation(checklistTranslations.labelLabel, language)}</Label>
        <Input
          id="checklist-item-label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="checklist-item-recurrence">
          {getTranslation(checklistTranslations.recurrenceLabel, language)}
        </Label>
        <select
          id="checklist-item-recurrence"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={recurrence}
          onChange={(event) => setRecurrence(event.target.value as ChecklistRecurrence)}
        >
          {(Object.keys(RECURRENCE_TRANSLATION_KEY) as ChecklistRecurrence[]).map((option) => (
            <option key={option} value={option}>
              {getTranslation(checklistTranslations[RECURRENCE_TRANSLATION_KEY[option]], language)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="checklist-item-category">
          {getTranslation(checklistTranslations.categoryLabel, language)}
        </Label>
        <select
          id="checklist-item-category"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="">{getTranslation(checklistTranslations.noCategoryOption, language)}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-xs text-destructive">{getTranslation(checklistTranslations.saveError, language)}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        {isEditing && (
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={submitting}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {getTranslation(checklistTranslations.deleteTask, language)}
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          {getTranslation(checklistTranslations.cancel, language)}
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {getTranslation(checklistTranslations.save, language)}
        </Button>
      </div>
    </form>
  );
}
