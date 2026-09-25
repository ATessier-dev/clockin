"use client";

import { useEffect, useState } from "react";
import { Sparkles, RotateCw, Save, X, ArrowLeft, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTranslation, postsTranslations, type Language } from "@/translations";

type TopicPickerEntry = {
  id: string;
  title: string;
  lastGeneratedAt: string | null;
};

/**
 * Generate flow for a medium: pick a topic (topics not yet treated by
 * this medium are surfaced first, already-treated ones below), then
 * generate/edit/regenerate/save a draft for that (topic, medium) pair.
 * Saving marks the topic as treated for this medium and feeds the topic's
 * own cross-medium history (shown on the Topics list) for future
 * anti-repetition. Open to any employee.
 */
export function GenerateForMediaPanel({ language, mediaId }: { language: Language; mediaId: string }) {
  const [topics, setTopics] = useState<TopicPickerEntry[] | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generateError, setGenerateError] = useState<"not_configured" | "generic" | null>(null);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/posts/media/${mediaId}/topics`)
      .then((response) => response.json())
      .then((data: { topics: TopicPickerEntry[] }) => {
        if (!cancelled) setTopics(data.topics);
      });

    return () => {
      cancelled = true;
    };
  }, [mediaId]);

  function selectTopic(topicId: string) {
    setSelectedTopicId(topicId);
    setDraft(null);
    setGenerateError(null);
    setSaveError(false);
  }

  function backToPicker() {
    setSelectedTopicId(null);
    setDraft(null);
  }

  async function handleGenerate() {
    if (!selectedTopicId) return;
    setGenerating(true);
    setGenerateError(null);
    setSaveError(false);

    const response = await fetch(`/api/posts/topics/${selectedTopicId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId }),
    });

    setGenerating(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setGenerateError(data?.error === "not_configured" ? "not_configured" : "generic");
      return;
    }

    const data = (await response.json()) as { content: string };
    setDraft(data.content);
  }

  async function handleCopy() {
    if (draft === null) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSave() {
    if (!selectedTopicId || draft === null) return;
    setSaving(true);
    setSaveError(false);

    const response = await fetch(`/api/posts/topics/${selectedTopicId}/generations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId, content: draft }),
    });

    setSaving(false);

    if (!response.ok) {
      setSaveError(true);
      return;
    }

    const savedAt = new Date().toISOString();
    setTopics((current) =>
      current?.map((topic) => (topic.id === selectedTopicId ? { ...topic, lastGeneratedAt: savedAt } : topic)) ?? null
    );
    backToPicker();
  }

  if (topics === null) return null;

  if (selectedTopicId === null) {
    const untreated = topics.filter((topic) => !topic.lastGeneratedAt);
    const treated = topics.filter((topic) => topic.lastGeneratedAt);

    return (
      <div className="w-full space-y-3 rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground">{getTranslation(postsTranslations.untreatedTopics, language)}</p>
        {untreated.length === 0 ? (
          <p className="text-xs text-muted-foreground">{getTranslation(postsTranslations.noUntreatedTopics, language)}</p>
        ) : (
          <ul className="space-y-1">
            {untreated.map((topic) => (
              <li key={topic.id}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto w-full whitespace-normal break-words py-2 text-left leading-snug"
                  onClick={() => selectTopic(topic.id)}
                >
                  {topic.title}
                </Button>
              </li>
            ))}
          </ul>
        )}

        {treated.length > 0 && (
          <>
            <p className="pt-2 text-xs font-medium text-muted-foreground">{getTranslation(postsTranslations.treatedTopics, language)}</p>
            <ul className="space-y-1">
              {treated.map((topic) => (
                <li key={topic.id}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto w-full whitespace-normal break-words py-2 text-left leading-snug"
                    onClick={() => selectTopic(topic.id)}
                  >
                    {topic.title}
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  }

  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId);

  return (
    <div className="w-full space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-2">
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={backToPicker}>
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">{getTranslation(postsTranslations.backToTopics, language)}</span>
        </Button>
        <p className="min-w-0 break-words text-sm font-medium">{selectedTopic?.title}</p>
      </div>

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
            <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
              {getTranslation(copied ? postsTranslations.copied : postsTranslations.copy, language)}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setDraft(null)} disabled={saving}>
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
    </div>
  );
}
