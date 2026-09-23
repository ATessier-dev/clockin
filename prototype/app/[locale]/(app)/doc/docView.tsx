"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FolderPlus, Pencil, Plus, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/pageHeading";
import { getTranslation, docTranslations, type Language } from "@/translations";
import { DocCategoryForm, type DocCategoryEntry } from "./editDocCategory";
import { DocLinkForm, type DocLinkEntry } from "./editDocLink";

type LinkFormMode = "create" | DocLinkEntry | null;
type CategoryFormMode = "create" | DocCategoryEntry | null;

export function DocView({
  language,
  isSuperuser,
  categories,
  links,
}: {
  language: Language;
  isSuperuser: boolean;
  categories: DocCategoryEntry[];
  links: DocLinkEntry[];
}) {
  const router = useRouter();
  const [linkFormMode, setLinkFormMode] = useState<LinkFormMode>(null);
  const [categoryFormMode, setCategoryFormMode] = useState<CategoryFormMode>(null);

  function openLinkForm(mode: LinkFormMode) {
    setCategoryFormMode(null);
    setLinkFormMode(mode);
  }

  function openCategoryForm(mode: CategoryFormMode) {
    setLinkFormMode(null);
    setCategoryFormMode(mode);
  }

  function handleLinkSaved() {
    setLinkFormMode(null);
    router.refresh();
  }

  function handleCategorySaved() {
    setCategoryFormMode(null);
    router.refresh();
  }

  function renderLinkRow(link: DocLinkEntry) {
    return (
      <div key={link.id} className="flex items-center gap-3 py-1.5">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {link.title}
        </a>
        {isSuperuser && (
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openLinkForm(link)}>
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">{getTranslation(docTranslations.editLink, language)}</span>
          </Button>
        )}
      </div>
    );
  }

  const categoryIds = new Set(categories.map((category) => category.id));
  // Also catches a link whose category was deleted between the two page
  // queries; it should still land in the uncategorized group, not vanish.
  const uncategorizedLinks = links.filter((link) => !link.categoryId || !categoryIds.has(link.categoryId));

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center space-y-4">
      <PageHeading
        title={
          <span className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
            {getTranslation(docTranslations.title, language)}
          </span>
        }
        actions={
          isSuperuser ? (
            <>
              <Button size="sm" variant="outline" onClick={() => openCategoryForm("create")}>
                <FolderPlus className="h-4 w-4" aria-hidden="true" />
                {getTranslation(docTranslations.addCategory, language)}
              </Button>
              <Button size="sm" onClick={() => openLinkForm("create")}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {getTranslation(docTranslations.addLink, language)}
              </Button>
            </>
          ) : undefined
        }
      />

      {isSuperuser && categoryFormMode && (
        <DocCategoryForm
          language={language}
          initialValues={categoryFormMode === "create" ? undefined : categoryFormMode}
          onCancel={() => setCategoryFormMode(null)}
          onSaved={handleCategorySaved}
          onDeleted={handleCategorySaved}
        />
      )}

      {isSuperuser && linkFormMode && (
        <DocLinkForm
          language={language}
          initialValues={linkFormMode === "create" ? undefined : linkFormMode}
          categories={categories}
          onCancel={() => setLinkFormMode(null)}
          onSaved={handleLinkSaved}
          onDeleted={handleLinkSaved}
        />
      )}

      {links.length === 0 && categories.length === 0 ? (
        <Card className="w-full">
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">{getTranslation(docTranslations.empty, language)}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {categories.map((category) => {
            const categoryLinks = links.filter((link) => link.categoryId === category.id);
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
                      <span className="sr-only">{getTranslation(docTranslations.editCategory, language)}</span>
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-1 pt-0">
                  {categoryLinks.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{getTranslation(docTranslations.empty, language)}</p>
                  ) : (
                    categoryLinks.map(renderLinkRow)
                  )}
                </CardContent>
              </Card>
            );
          })}

          {(uncategorizedLinks.length > 0 || categories.length === 0) && (
            <Card className="w-full">
              {categories.length > 0 && (
                <CardHeader className="py-3">
                  <CardTitle className="text-base">
                    {getTranslation(docTranslations.uncategorized, language)}
                  </CardTitle>
                </CardHeader>
              )}
              <CardContent className={categories.length > 0 ? "space-y-1 pt-0" : "space-y-1 py-4"}>
                {uncategorizedLinks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{getTranslation(docTranslations.empty, language)}</p>
                ) : (
                  uncategorizedLinks.map(renderLinkRow)
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
