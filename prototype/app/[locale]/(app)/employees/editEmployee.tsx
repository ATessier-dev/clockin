"use client";

import { useState, useEffect, type FormEvent } from "react";
import { UserX, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTranslation, employeesTranslations, type Language } from "@/translations";

export type EmployeeEntry = {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  role: "EMPLOYEE" | "SUPERUSER";
  phone: string | null;
  preferredWorkplaceId: string | null;
  availabilityNote: string | null;
  active: boolean;
};

export type WorkplaceOption = { id: string; label: string };

export function EmployeeForm({
  language,
  workplaces,
  initialValues,
  onCancel,
  onSaved,
  onStatusChanged,
}: {
  language: Language;
  workplaces: WorkplaceOption[];
  initialValues?: EmployeeEntry;
  onCancel: () => void;
  onSaved: (employee: EmployeeEntry) => void;
  onStatusChanged: (employee: EmployeeEntry) => void;
}) {
  const isEditing = Boolean(initialValues);

  const [code, setCode] = useState(initialValues?.code ?? "");
  const [codeLoading, setCodeLoading] = useState(!isEditing);
  const [firstName, setFirstName] = useState(initialValues?.firstName ?? "");
  const [lastName, setLastName] = useState(initialValues?.lastName ?? "");
  const [role, setRole] = useState<"EMPLOYEE" | "SUPERUSER">(initialValues?.role ?? "EMPLOYEE");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [preferredWorkplaceId, setPreferredWorkplaceId] = useState(initialValues?.preferredWorkplaceId ?? "");
  const [availabilityNote, setAvailabilityNote] = useState(initialValues?.availabilityNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Suggest a fresh unique code on creation — the superuser can still edit it.
  useEffect(() => {
    if (isEditing) return;
    let cancelled = false;

    fetch("/api/employees/generate-code")
      .then((response) => response.json())
      .then((data: { code?: string }) => {
        if (!cancelled && data.code) setCode(data.code);
      })
      .finally(() => {
        if (!cancelled) setCodeLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function readEmployee(response: Response): Promise<EmployeeEntry | null> {
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(
        data?.error === "code_taken"
          ? getTranslation(employeesTranslations.codeTaken, language)
          : getTranslation(employeesTranslations.saveError, language)
      );
      return null;
    }
    const data = (await response.json()) as { employee: EmployeeEntry };
    return data.employee;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch(isEditing ? `/api/employees/${initialValues!.id}` : "/api/employees", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: isEditing ? (code !== initialValues!.code ? code : undefined) : code,
        firstName,
        lastName,
        role,
        phone: phone || null,
        preferredWorkplaceId: preferredWorkplaceId || null,
        availabilityNote: availabilityNote || null,
      }),
    });

    setSubmitting(false);
    const employee = await readEmployee(response);
    if (employee) onSaved(employee);
  }

  async function handleToggleActive() {
    if (!initialValues) return;
    setSubmitting(true);
    setError(null);

    const response = initialValues.active
      ? await fetch(`/api/employees/${initialValues.id}`, { method: "DELETE" })
      : await fetch(`/api/employees/${initialValues.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: true }),
        });

    setSubmitting(false);
    const employee = await readEmployee(response);
    if (employee) onStatusChanged(employee);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="space-y-1">
        <Label htmlFor="employee-code">{getTranslation(employeesTranslations.codeLabel, language)}</Label>
        <Input
          id="employee-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          disabled={codeLoading}
          placeholder={codeLoading ? "…" : undefined}
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="employee-first-name">{getTranslation(employeesTranslations.firstNameLabel, language)}</Label>
        <Input
          id="employee-first-name"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="employee-last-name">{getTranslation(employeesTranslations.lastNameLabel, language)}</Label>
        <Input
          id="employee-last-name"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="employee-role">{getTranslation(employeesTranslations.roleLabel, language)}</Label>
        <select
          id="employee-role"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={role}
          onChange={(event) => setRole(event.target.value as "EMPLOYEE" | "SUPERUSER")}
        >
          <option value="EMPLOYEE">{getTranslation(employeesTranslations.roleEmployee, language)}</option>
          <option value="SUPERUSER">{getTranslation(employeesTranslations.roleSuperuser, language)}</option>
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="employee-phone">{getTranslation(employeesTranslations.phoneLabel, language)}</Label>
        <Input id="employee-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="employee-workplace">
          {getTranslation(employeesTranslations.preferredWorkplaceLabel, language)}
        </Label>
        <select
          id="employee-workplace"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={preferredWorkplaceId}
          onChange={(event) => setPreferredWorkplaceId(event.target.value)}
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
        <Label htmlFor="employee-note">{getTranslation(employeesTranslations.availabilityNoteLabel, language)}</Label>
        <Input
          id="employee-note"
          value={availabilityNote}
          onChange={(event) => setAvailabilityNote(event.target.value)}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        {isEditing && (
          <Button
            type="button"
            variant={initialValues!.active ? "destructive" : "outline"}
            size="sm"
            onClick={handleToggleActive}
            disabled={submitting}
          >
            {initialValues!.active ? (
              <UserX className="h-4 w-4" aria-hidden="true" />
            ) : (
              <UserCheck className="h-4 w-4" aria-hidden="true" />
            )}
            {getTranslation(
              initialValues!.active ? employeesTranslations.deactivate : employeesTranslations.reactivate,
              language
            )}
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          {getTranslation(employeesTranslations.cancel, language)}
        </Button>
        <Button type="submit" size="sm" disabled={submitting || codeLoading}>
          {getTranslation(employeesTranslations.save, language)}
        </Button>
      </div>
    </form>
  );
}
