"use client";

import { useState, type FormEvent } from "react";
import { UserCog, Check, Save, KeyRound } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTranslation, profileTranslations, type Language } from "@/translations";

export type ProfileEmployee = {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  preferredWorkplaceId: string | null;
  availabilityNote: string | null;
  locale: Language;
};

export type WorkplaceOption = { id: string; label: string };

export function ProfileView({
  language,
  employee,
  workplaces,
}: {
  language: Language;
  employee: ProfileEmployee;
  workplaces: WorkplaceOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [firstName, setFirstName] = useState(employee.firstName);
  const [lastName, setLastName] = useState(employee.lastName);
  const [phone, setPhone] = useState(employee.phone ?? "");
  const [preferredWorkplaceId, setPreferredWorkplaceId] = useState(employee.preferredWorkplaceId ?? "");
  const [availabilityNote, setAvailabilityNote] = useState(employee.availabilityNote ?? "");
  const [locale, setLocale] = useState<Language>(employee.locale);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(false);
    setSaved(false);

    const response = await fetch(`/api/employees/${employee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        phone: phone || null,
        preferredWorkplaceId: preferredWorkplaceId || null,
        availabilityNote: availabilityNote || null,
        locale,
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError(true);
      return;
    }

    if (locale !== employee.locale) {
      // Switch the active UI language by navigating to the same page under
      // the new locale prefix — next-intl's router handles the redirect.
      router.replace(pathname, { locale });
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <UserCog className="h-4 w-4 text-primary" aria-hidden="true" />
          {getTranslation(profileTranslations.title, language)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>{getTranslation(profileTranslations.codeLabel, language)}</Label>
            <p className="flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
              <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
              {employee.code}
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="profile-first-name">
              {getTranslation(profileTranslations.firstNameLabel, language)}
            </Label>
            <Input
              id="profile-first-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="profile-last-name">
              {getTranslation(profileTranslations.lastNameLabel, language)}
            </Label>
            <Input
              id="profile-last-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="profile-phone">{getTranslation(profileTranslations.phoneLabel, language)}</Label>
            <Input id="profile-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="profile-workplace">
              {getTranslation(profileTranslations.preferredWorkplaceLabel, language)}
            </Label>
            <select
              id="profile-workplace"
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
            <Label htmlFor="profile-note">
              {getTranslation(profileTranslations.availabilityNoteLabel, language)}
            </Label>
            <Input
              id="profile-note"
              value={availabilityNote}
              onChange={(event) => setAvailabilityNote(event.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="profile-locale">{getTranslation(profileTranslations.localeLabel, language)}</Label>
            <select
              id="profile-locale"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={locale}
              onChange={(event) => setLocale(event.target.value as Language)}
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>

          {error && (
            <p className="text-xs text-destructive">{getTranslation(profileTranslations.saveError, language)}</p>
          )}
          {saved && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              {getTranslation(profileTranslations.saved, language)}
            </p>
          )}

          <Button type="submit" size="sm" disabled={submitting}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {getTranslation(profileTranslations.save, language)}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
