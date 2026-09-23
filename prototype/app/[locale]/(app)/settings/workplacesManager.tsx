"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/pageHeading";
import { getTranslation, workplacesTranslations, type Language } from "@/translations";
import { WorkplaceForm, type WorkplaceEntry } from "./editWorkplace";

export function WorkplacesManager({
  language,
  workplaces,
}: {
  language: Language;
  workplaces: WorkplaceEntry[];
}) {
  const router = useRouter();
  const [formMode, setFormMode] = useState<"create" | WorkplaceEntry | null>(null);

  function handleSaved() {
    setFormMode(null);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <PageHeading
        title={
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
            {getTranslation(workplacesTranslations.title, language)}
          </span>
        }
        actions={
          <Button size="sm" onClick={() => setFormMode("create")}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {getTranslation(workplacesTranslations.addWorkplace, language)}
          </Button>
        }
      />

      {formMode && (
        <WorkplaceForm
          language={language}
          initialValues={formMode === "create" ? undefined : formMode}
          onCancel={() => setFormMode(null)}
          onSaved={handleSaved}
          onDeleted={handleSaved}
        />
      )}

      <div className="flex w-full flex-col gap-3">
        {workplaces.map((workplace) => (
          <Card key={workplace.id} className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: workplace.color }}
                  aria-hidden="true"
                />
                {workplace.label}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setFormMode(workplace)}>
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                {getTranslation(workplacesTranslations.editWorkplace, language)}
              </Button>
            </CardHeader>
            {workplace.description && (
              <CardContent className="text-sm text-muted-foreground">
                <p>{workplace.description}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
