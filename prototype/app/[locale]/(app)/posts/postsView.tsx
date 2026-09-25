"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Megaphone, FolderPlus, Sparkles, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/pageHeading";
import { getTranslation, postsTranslations, type Language } from "@/translations";
import { PostItemForm, type PostItemEntry, type PostCategoryEntry } from "./editPostItem";
import { PostCategoryForm } from "./editPostCategory";
import { GeneratePostPanel } from "./generatePost";
import { cn } from "@/lib/utils";

type ItemFormMode = "create" | PostItemEntry | null;
type CategoryFormMode = "create" | PostCategoryEntry | null;

/**
 * Renders the posts page: topics grouped by category plus an
 * uncategorized group, a generate panel per topic, and (for superusers)
 * the forms to create/edit topics and categories.
 */
export function PostsView({
  language,
  isSuperuser,
  categories,
  items,
}: {
  language: Language;
  isSuperuser: boolean;
  categories: PostCategoryEntry[];
  items: PostItemEntry[];
}) {
  const router = useRouter();
  const [itemFormMode, setItemFormMode] = useState<ItemFormMode>(null);
  const [categoryFormMode, setCategoryFormMode] = useState<CategoryFormMode>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

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

  function toggleGenerate(itemId: string) {
    setExpandedItemId((current) => (current === itemId ? null : itemId));
  }

  function renderItemRow(item: PostItemEntry) {
    return (
      <div key={item.id} className="space-y-2 py-1.5">
        <div className="flex items-center gap-3">
          <span className="flex flex-1 items-center gap-2 text-sm">
            {item.title}
            {item.documents.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" aria-hidden="true" />
                {item.documents.length}
              </span>
            )}
          </span>
          <Button
            variant={expandedItemId === item.id ? "default" : "outline"}
            size="sm"
            onClick={() => toggleGenerate(item.id)}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {getTranslation(postsTranslations.generate, language)}
          </Button>
          {isSuperuser && (
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openItemForm(item)}>
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">{getTranslation(postsTranslations.editTopic, language)}</span>
            </Button>
          )}
        </div>
        {expandedItemId === item.id && <GeneratePostPanel language={language} itemId={item.id} />}
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
            <Megaphone className="h-5 w-5 text-primary" aria-hidden="true" />
            {getTranslation(postsTranslations.title, language)}
          </span>
        }
        actions={
          isSuperuser ? (
            <>
              <Button size="sm" variant="outline" onClick={() => openCategoryForm("create")}>
                <FolderPlus className="h-4 w-4" aria-hidden="true" />
                {getTranslation(postsTranslations.addCategory, language)}
              </Button>
              <Button size="sm" onClick={() => openItemForm("create")}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {getTranslation(postsTranslations.addTopic, language)}
              </Button>
            </>
          ) : undefined
        }
      />

      {isSuperuser && categoryFormMode && (
        <PostCategoryForm
          language={language}
          initialValues={categoryFormMode === "create" ? undefined : categoryFormMode}
          onCancel={() => setCategoryFormMode(null)}
          onSaved={handleCategorySaved}
          onDeleted={handleCategorySaved}
        />
      )}

      {isSuperuser && itemFormMode && (
        <PostItemForm
          language={language}
          initialValues={itemFormMode === "create" ? undefined : itemFormMode}
          categories={categories}
          onCancel={() => setItemFormMode(null)}
          onSaved={handleItemSaved}
          onDeleted={handleItemSaved}
        />
      )}

      {items.length === 0 && categories.length === 0 ? (
        <Card className="w-full">
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">{getTranslation(postsTranslations.empty, language)}</p>
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
                      <span className="sr-only">{getTranslation(postsTranslations.editCategory, language)}</span>
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-1 pt-0">
                  {categoryItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{getTranslation(postsTranslations.empty, language)}</p>
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
                  <CardTitle className="text-base">{getTranslation(postsTranslations.uncategorized, language)}</CardTitle>
                </CardHeader>
              )}
              <CardContent className={cn("space-y-1", categories.length > 0 ? "pt-0" : "py-4")}>
                {uncategorizedItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{getTranslation(postsTranslations.empty, language)}</p>
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
