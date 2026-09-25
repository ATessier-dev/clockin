"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getTranslation, navbarTranslations, type Language } from "@/translations";

export function LogoutButton({ language }: { language: Language }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    // Never reset to false: the button stays disabled until navigation to
    // /login unmounts it, so there's no "logged out but still clickable" state.
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} disabled={loading}>
      <LogOut className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">{getTranslation(navbarTranslations.logout, language)}</span>
    </Button>
  );
}
