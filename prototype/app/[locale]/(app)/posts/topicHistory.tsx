"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTranslation, postsTranslations, type Language } from "@/translations";

export type PostGenerationEntry = {
  id: string;
  content: string;
  createdAt: string;
  media: { id: string; name: string };
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
 * A topic's full generation history, across every medium (the anti-
 * repetition scope: a text saved for Reddit still counts when generating
 * for LinkedIn). Each entry is tagged with the medium it was written for.
 */
export function TopicHistory({ language, topicId }: { language: Language; topicId: string }) {
  const [history, setHistory] = useState<PostGenerationEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/posts/topics/${topicId}/generations`)
      .then((response) => response.json())
      .then((data: { generations: PostGenerationEntry[] }) => {
        if (!cancelled) setHistory(data.generations);
      });

    return () => {
      cancelled = true;
    };
  }, [topicId]);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{getTranslation(postsTranslations.history, language)}</p>
      {history === null ? null : history.length === 0 ? (
        <p className="text-xs text-muted-foreground">{getTranslation(postsTranslations.noHistory, language)}</p>
      ) : (
        <ul className="space-y-3">
          {history.map((generation) => (
            <li key={generation.id} className="space-y-1.5 rounded-md bg-muted/50 p-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="font-normal">
                  {generation.media.name}
                </Badge>
                <CopyButton text={generation.content} language={language} />
              </div>
              <p className="whitespace-pre-wrap text-sm">{generation.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
