"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, ListChecks, Repeat, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeading } from "@/components/ui/pageHeading";
import { getTranslation, checklistTranslations, type Language } from "@/translations";
import { ChecklistItemForm, RECURRENCE_TRANSLATION_KEY, type ChecklistItemEntry } from "./editChecklistItem";
import { cn } from "@/lib/utils";

export function ChecklistView({
  language,
  isSuperuser,
  currentEmployeeId,
  items,
}: {
  language: Language;
  isSuperuser: boolean;
  currentEmployeeId: string;
  items: ChecklistItemEntry[];
}) {
  const router = useRouter();
  const [formMode, setFormMode] = useState<"create" | ChecklistItemEntry | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  function handleSaved() {
    setFormMode(null);
    router.refresh();
  }

  async function handleToggle(item: ChecklistItemEntry) {
    setTogglingId(item.id);
    setToggleError(null);

    const response = await fetch(`/api/checklist/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !item.completed }),
    });

    setTogglingId(null);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (data?.error === "not_owner") {
        setToggleError(getTranslation(checklistTranslations.uncheckForbidden, language));
      }
    }

    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center space-y-4">
      <PageHeading
        title={
          <span className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" aria-hidden="true" />
            {getTranslation(checklistTranslations.title, language)}
          </span>
        }
        actions={
          isSuperuser ? (
            <Button size="sm" onClick={() => setFormMode("create")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {getTranslation(checklistTranslations.addTask, language)}
            </Button>
          ) : undefined
        }
      />

      {isSuperuser && formMode && (
        <ChecklistItemForm
          language={language}
          initialValues={formMode === "create" ? undefined : formMode}
          onCancel={() => setFormMode(null)}
          onSaved={handleSaved}
          onDeleted={handleSaved}
        />
      )}

      {toggleError && <p className="text-xs text-destructive">{toggleError}</p>}

      <Card className="w-full">
        <CardContent className="space-y-1 py-4">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground">{getTranslation(checklistTranslations.empty, language)}</p>
          ) : (
            items.map((item) => {
              const canUncheck = isSuperuser || item.completedByEmployee?.id === currentEmployeeId;
              const checkboxDisabled = togglingId === item.id || (item.completed && !canUncheck);
              return (
                <div key={item.id} className="flex items-center gap-3 py-1.5">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggle(item)}
                    disabled={checkboxDisabled}
                    className="h-4 w-4 shrink-0 cursor-pointer rounded border-input accent-primary disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={item.label}
                    title={
                      item.completed && !canUncheck
                        ? getTranslation(checklistTranslations.uncheckForbidden, language)
                        : undefined
                    }
                  />
                  <span className="flex flex-1 flex-col">
                    <span
                      className={cn(
                        "flex items-center gap-2 text-sm",
                        item.completed && "text-muted-foreground line-through"
                      )}
                    >
                      {item.label}
                      {item.recurrence !== "ONE_TIME" && (
                        <Badge variant="outline" className="gap-1 font-normal no-underline">
                          <Repeat className="h-3 w-3" aria-hidden="true" />
                          {getTranslation(checklistTranslations[RECURRENCE_TRANSLATION_KEY[item.recurrence]], language)}
                        </Badge>
                      )}
                    </span>
                    {item.completed && item.completedByEmployee && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" aria-hidden="true" />
                        {getTranslation(checklistTranslations.checkedByPrefix, language)}{" "}
                        {item.completedByEmployee.firstName} {item.completedByEmployee.lastName}
                      </span>
                    )}
                  </span>
                  {isSuperuser && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFormMode(item)}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">
                        {getTranslation(checklistTranslations.editTask, language)}
                      </span>
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
