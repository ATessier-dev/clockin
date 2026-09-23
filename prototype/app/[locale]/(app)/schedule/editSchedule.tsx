"use client";

import { useState, type FormEvent } from "react";
import { format, set } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTranslation, scheduleCalendarTranslations, type Language } from "@/translations";
import type { ShiftListItem } from "./shiftDisplay";

export type EmployeeOption = { id: string; firstName: string; lastName: string };
export type WorkplaceOption = { id: string; label: string; color: string };

const DATETIME_LOCAL_FORMAT = "yyyy-MM-dd'T'HH:mm";

export function shiftToFormDefaults(shift: ShiftListItem) {
  return {
    id: shift.id,
    employeeId: shift.employeeId,
    workplaceId: shift.workplaceId,
    startAt: format(shift.startAt, DATETIME_LOCAL_FORMAT),
    endAt: format(shift.endAt, DATETIME_LOCAL_FORMAT),
  };
}

export function ShiftForm({
  language,
  employees,
  workplaces,
  initialValues,
  initialDate,
  onCancel,
  onSaved,
  onDeleted,
}: {
  language: Language;
  employees: EmployeeOption[];
  workplaces: WorkplaceOption[];
  initialValues?: ReturnType<typeof shiftToFormDefaults>;
  // Only used when creating (no initialValues) — prefills the date from the
  // day card the "+" button was clicked on, with a sensible default time.
  initialDate?: Date;
  onCancel: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const defaultStartAt =
    initialValues?.startAt ??
    (initialDate ? format(set(initialDate, { hours: 11, minutes: 0, seconds: 0 }), DATETIME_LOCAL_FORMAT) : "");
  const defaultEndAt =
    initialValues?.endAt ??
    (initialDate ? format(set(initialDate, { hours: 18, minutes: 0, seconds: 0 }), DATETIME_LOCAL_FORMAT) : "");

  const [employeeId, setEmployeeId] = useState(initialValues?.employeeId ?? employees[0]?.id ?? "");
  const [workplaceId, setWorkplaceId] = useState(initialValues?.workplaceId ?? workplaces[0]?.id ?? "");
  const [startAt, setStartAt] = useState(defaultStartAt);
  const [endAt, setEndAt] = useState(defaultEndAt);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(initialValues);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(false);

    const response = await fetch(isEditing ? `/api/shifts/${initialValues!.id}` : "/api/shifts", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId,
        workplaceId,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
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

    const response = await fetch(`/api/shifts/${initialValues.id}`, { method: "DELETE" });

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
        <Label htmlFor="shift-employee">{getTranslation(scheduleCalendarTranslations.employeeLabel, language)}</Label>
        <select
          id="shift-employee"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={employeeId}
          onChange={(event) => setEmployeeId(event.target.value)}
          required
        >
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.firstName} {employee.lastName}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="shift-workplace">{getTranslation(scheduleCalendarTranslations.workplaceLabel, language)}</Label>
        <select
          id="shift-workplace"
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

      <div className="space-y-1">
        <Label htmlFor="shift-start">{getTranslation(scheduleCalendarTranslations.startAtLabel, language)}</Label>
        <Input
          id="shift-start"
          type="datetime-local"
          value={startAt}
          onChange={(event) => setStartAt(event.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="shift-end">{getTranslation(scheduleCalendarTranslations.endAtLabel, language)}</Label>
        <Input
          id="shift-end"
          type="datetime-local"
          value={endAt}
          onChange={(event) => setEndAt(event.target.value)}
          required
        />
      </div>

      {error && (
        <p className="text-xs text-destructive">
          {getTranslation(scheduleCalendarTranslations.saveError, language)}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {isEditing && (
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={submitting}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {getTranslation(scheduleCalendarTranslations.deleteShift, language)}
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          {getTranslation(scheduleCalendarTranslations.cancel, language)}
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {getTranslation(scheduleCalendarTranslations.save, language)}
        </Button>
      </div>
    </form>
  );
}
