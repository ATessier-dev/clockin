"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redirect } from '@/i18n/navigation';
import { getTranslation, loginTranslations, type Language } from "@/translations";

type LoginResponse = {
  employee: { id: string; firstName: string; lastName: string; role: string };
};

/** Throws on a non-2xx response so react-query's `isError` reflects an invalid code. */
async function login(code: string): Promise<LoginResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error("invalid_code");
  }

  return response.json();
}

/** Employee code login form; redirects to /dashboard once login succeeds. */
export function LoginForm({ language }: { language: Language }) {
  const [code, setCode] = useState("");
  const mutation = useMutation({ mutationFn: login });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate(code);
  }

  // /dashboard doesn't exist yet (build order step 2) — until then, a
  // successful login just confirms the session cookie was set; check
  // /api/me directly to verify the employee/role it carries.
  if (mutation.isSuccess) {
    redirect({href: "/dashboard", locale : language})
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">{getTranslation(loginTranslations.codeLabel, language)}</Label>
        <Input
          id="code"
          type="text"
          autoFocus
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
      </div>
      {mutation.isError && (
        <p className="text-sm text-destructive">
          {getTranslation(loginTranslations.invalidCode, language)}
        </p>
      )}
      <Button type="submit" disabled={mutation.isPending || !code} className="w-full">
        <LogIn className="h-4 w-4" aria-hidden="true" />
        {getTranslation(loginTranslations.submit, language)}
      </Button>
    </form>
  );
}
