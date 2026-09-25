"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, ListChecks, Repeat, User, FolderPlus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeading } from "@/components/ui/pageHeading";
import { getTranslation, checklistTranslations, type Language } from "@/translations";
import {
  ChecklistItemForm,
  RECURRENCE_TRANSLATION_KEY,
  type ChecklistItemEntry,
  type ChecklistCategoryEntry,
} from "./editChecklistItem";
import { ChecklistCategoryForm } from "./editChecklistCategory";
import { cn } from "@/lib/utils";

type ItemFormMode = "create" | ChecklistItemEntry | null;
type CategoryFormMode = "create" | ChecklistCategoryEntry | null;

/**
 * Renders the checklist page: grouped items by category plus an
 * uncategorized group, and (for superusers) the forms to create/edit
 * items and categories.
 */
export function ChecklistView({
  language,
  isSuperuser,
  currentEmployeeId,
  categories,
  items,
}: {
  language: Language;
  isSuperuser: boolean;
  currentEmployeeId: string;
  categories: ChecklistCategoryEntry[];
  items: ChecklistItemEntry[];
}) {
  const router = useRouter();
  const [itemFormMode, setItemFormMode] = useState<ItemFormMode>(null);
  const [categoryFormMode, setCategoryFormMode] = useState<CategoryFormMode>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  // Only one form (item or category) can be open at a time, so opening
  // either one closes the other.
  function openItemForm(mode: ItemFormMode) {
    setCategoryFormMode(null);
    setItemFormMode(mode);
  }

  function openCategoryForm(mode: CategoryFormMode) {
    setItemFormMode(null);
    setCategoryFormMode(mode);
  }

  function handleItemSaved() {
    setItemFormMode(null);
    router.refresh();
  }

  function handleCategorySaved() {
    setCategoryFormMode(null);
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

    // The API only rejects with "not_owner" (see canUncheck below); any
    // other failure is treated as unexpected and left unreported here.
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (data?.error === "not_owner") {
        setToggleError(getTranslation(checklistTranslations.uncheckForbidden, language));
      }
    }

    router.refresh();
  }

  function renderItemRow(item: ChecklistItemEntry) {
    // Once checked, only a superuser or whoever checked it off can uncheck
    // it, so a completed item stays visible proof of who handled it.
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
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openItemForm(item)}>
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">{getTranslation(checklistTranslations.editTask, language)}</span>
          </Button>
        )}
      </div>
    );
  }

  const categoryIds = new Set(categories.map((category) => category.id));
  // Also catches an item whose category was deleted between the two page
  // queries; it should still land in the uncategorized group, not vanish.
  const uncategorizedItems = items.filter((item) => !item.categoryId || !categoryIds.has(item.categoryId));

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
            <>
              <Button size="sm" variant="outline" onClick={() => openCategoryForm("create")}>
                <FolderPlus className="h-4 w-4" aria-hidden="true" />
                {getTranslation(checklistTranslations.addCategory, language)}
              </Button>
              <Button size="sm" onClick={() => openItemForm("create")}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {getTranslation(checklistTranslations.addTask, language)}
              </Button>
            </>
          ) : undefined
        }
      />

      {isSuperuser && categoryFormMode && (
        <ChecklistCategoryForm
          language={language}
          initialValues={categoryFormMode === "create" ? undefined : categoryFormMode}
          onCancel={() => setCategoryFormMode(null)}
          onSaved={handleCategorySaved}
          onDeleted={handleCategorySaved}
        />
      )}

      {isSuperuser && itemFormMode && (
        <ChecklistItemForm
          language={language}
          initialValues={itemFormMode === "create" ? undefined : itemFormMode}
          categories={categories}
          onCancel={() => setItemFormMode(null)}
          onSaved={handleItemSaved}
          onDeleted={handleItemSaved}
        />
      )}

      {toggleError && <p className="text-xs text-destructive">{toggleError}</p>}

      {items.length === 0 && categories.length === 0 ? (
        <Card className="w-full">
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">{getTranslation(checklistTranslations.empty, language)}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {categories.map((category) => {
            const categoryItems = items.filter((item) => item.categoryId === category.id);
            return (
              <Card key={category.id} className="w-full">
                <CardHeader className="flex-row items-center justify-between space-y-0 py-3">
                  <CardTitle className="text-base">{category.name}</CardTitle>
                  {isSuperuser && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openCategoryForm(category)}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">
                        {getTranslation(checklistTranslations.editCategory, language)}
                      </span>
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-1 pt-0">
                  {categoryItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {getTranslation(checklistTranslations.empty, language)}
                    </p>
                  ) : (
                    categoryItems.map(renderItemRow)
                  )}
                </CardContent>
              </Card>
            );
          })}

          {(uncategorizedItems.length > 0 || categories.length === 0) && (
            <Card className="w-full">
              {categories.length > 0 && (
                <CardHeader className="py-3">
                  <CardTitle className="text-base">
                    {getTranslation(checklistTranslations.uncategorized, language)}
                  </CardTitle>
                </CardHeader>
              )}
              <CardContent className={cn("space-y-1", categories.length > 0 ? "pt-0" : "py-4")}>
                {uncategorizedItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {getTranslation(checklistTranslations.empty, language)}
                  </p>
                ) : (
                  uncategorizedItems.map(renderItemRow)
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
