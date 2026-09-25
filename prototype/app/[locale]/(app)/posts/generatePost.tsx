"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Sparkles, RotateCw, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTranslation, postsTranslations, type Language } from "@/translations";

export type PostGenerationEntry = {
  id: string;
  content: string;
  createdAt: string;
  createdByEmployee: { id: string; firstName: string; lastName: string };
};

function CopyButton({ text, language }: { text: string; language: Language }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    // Long enough to register as feedback, short enough that the button
    // doesn't stay in a "copied" state if the user comes back to it later.
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      {getTranslation(copied ? postsTranslations.copied : postsTranslations.copy, language)}
    </Button>
  );
}

/**
 * Generate/edit/save flow for a post item, grounded in its reference
 * documents. Generating produces an editable draft, not a saved entry: the
 * employee can regenerate, hand-edit, or save it, and only a save adds it
 * to the history shown below (also the anti-repetition context for future
 * generations). Open to any employee.
 */
export function GeneratePostPanel({ language, itemId }: { language: Language; itemId: string }) {
  const [history, setHistory] = useState<PostGenerationEntry[] | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generateError, setGenerateError] = useState<"not_configured" | "generic" | null>(null);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/posts/items/${itemId}/generations`)
      .then((response) => response.json())
      .then((data: { generations: PostGenerationEntry[] }) => {
        if (!cancelled) setHistory(data.generations);
      });

    return () => {
      cancelled = true;
    };
  }, [itemId]);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    setSaveError(false);

    const response = await fetch(`/api/posts/items/${itemId}/generate`, { method: "POST" });

    setGenerating(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setGenerateError(data?.error === "not_configured" ? "not_configured" : "generic");
      return;
    }

    const data = (await response.json()) as { content: string };
    setDraft(data.content);
  }

  function handleDiscard() {
    setDraft(null);
    setSaveError(false);
  }

  async function handleSave() {
    if (draft === null) return;
    setSaving(true);
    setSaveError(false);

    const response = await fetch(`/api/posts/items/${itemId}/generations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });

    setSaving(false);

    if (!response.ok) {
      setSaveError(true);
      return;
    }

    const data = (await response.json()) as { generation: PostGenerationEntry };
    setHistory((current) => [data.generation, ...(current ?? [])]);
    setDraft(null);
  }

  return (
    <div className="w-full space-y-3 rounded-lg border border-border bg-card p-4">
      {draft === null ? (
        <Button type="button" size="sm" onClick={handleGenerate} disabled={generating}>
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {getTranslation(generating ? postsTranslations.generating : postsTranslations.generate, language)}
        </Button>
      ) : (
        <div className="space-y-2">
          <textarea
            className="min-h-32 w-full rounded-md border border-input bg-background p-3 text-sm"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleGenerate} disabled={generating || saving}>
              <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
              {getTranslation(generating ? postsTranslations.generating : postsTranslations.regenerate, language)}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleDiscard} disabled={saving}>
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {getTranslation(postsTranslations.cancel, language)}
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={saving || generating || !draft.trim()}>
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              {getTranslation(postsTranslations.save, language)}
            </Button>
          </div>
          {saveError && <p className="text-xs text-destructive">{getTranslation(postsTranslations.saveError, language)}</p>}
        </div>
      )}

      {generateError && (
        <p className="text-xs text-destructive">
          {getTranslation(
            generateError === "not_configured" ? postsTranslations.notConfigured : postsTranslations.generationError,
            language
          )}
        </p>
      )}

      <div className="space-y-2 border-t border-border pt-3">
        <p className="text-xs font-medium text-muted-foreground">{getTranslation(postsTranslations.history, language)}</p>
        {history === null ? null : history.length === 0 ? (
          <p className="text-xs text-muted-foreground">{getTranslation(postsTranslations.noHistory, language)}</p>
        ) : (
          <ul className="space-y-3">
            {history.map((generation) => (
              <li key={generation.id} className="space-y-1.5 rounded-md bg-muted/50 p-3">
                <div className="flex items-center justify-end gap-2">
                  <CopyButton text={generation.content} language={language} />
                </div>
                <p className="whitespace-pre-wrap text-sm">{generation.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
