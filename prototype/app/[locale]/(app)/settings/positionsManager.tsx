"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Briefcase } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/pageHeading";
import { getTranslation, positionsTranslations, type Language } from "@/translations";
import { PositionForm, type PositionEntry } from "./editPosition";

/**
 * Lists configured positions and toggles the inline create/edit form.
 * `formMode` holds "create", the position being edited, or null.
 */
export function PositionsManager({
  language,
  positions,
}: {
  language: Language;
  positions: PositionEntry[];
}) {
  const router = useRouter();
  const [formMode, setFormMode] = useState<"create" | PositionEntry | null>(null);

  function handleSaved() {
    setFormMode(null);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <PageHeading
        title={
          <span className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" aria-hidden="true" />
            {getTranslation(positionsTranslations.title, language)}
          </span>
        }
        actions={
          <Button size="sm" onClick={() => setFormMode("create")}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {getTranslation(positionsTranslations.addPosition, language)}
          </Button>
        }
      />

      {formMode && (
        <PositionForm
          language={language}
          initialValues={formMode === "create" ? undefined : formMode}
          onCancel={() => setFormMode(null)}
          onSaved={handleSaved}
          onDeleted={handleSaved}
        />
      )}

      <div className="flex w-full flex-col gap-3">
        {positions.length === 0 ? (
          <p className="text-xs text-muted-foreground">{getTranslation(positionsTranslations.empty, language)}</p>
        ) : (
          positions.map((position) => (
            <Card key={position.id} className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: position.color }}
                    aria-hidden="true"
                  />
                  {position.name}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setFormMode(position)}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  {getTranslation(positionsTranslations.editPosition, language)}
                </Button>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
