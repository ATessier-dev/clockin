"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Megaphone, Sparkles, FileText, Radio, Newspaper, History, RefreshCw, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeading } from "@/components/ui/pageHeading";
import { getTranslation, postsTranslations, type Language } from "@/translations";
import { PostMediaForm, type PostMediaEntry } from "./editMedia";
import { PostTopicForm, type PostTopicEntry } from "./editTopic";
import { GenerateForMediaPanel } from "./generateForMedia";
import { TopicHistory } from "./topicHistory";
import { cn } from "@/lib/utils";

type MediaFormMode = "create" | PostMediaEntry | null;
type TopicFormMode = "create" | PostTopicEntry | null;

/**
 * Renders the posts page as two independent lists: Media (where to post,
 * each with a "Generate" action that picks a topic to write for) and
 * Topics (what to post about, each with its own cross-media generation
 * history). Superusers can manage both lists; generating is open to
 * everyone.
 */
export function PostsView({
  language,
  isSuperuser,
  media,
  topics,
}: {
  language: Language;
  isSuperuser: boolean;
  media: PostMediaEntry[];
  topics: PostTopicEntry[];
}) {
  const router = useRouter();
  const [mediaFormMode, setMediaFormMode] = useState<MediaFormMode>(null);
  const [topicFormMode, setTopicFormMode] = useState<TopicFormMode>(null);
  const [expandedMediaId, setExpandedMediaId] = useState<string | null>(null);
  const [expandedHistoryTopicId, setExpandedHistoryTopicId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<"unreachable" | "generic" | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  async function handleRefreshFromArtur() {
    setRefreshing(true);
    setRefreshError(null);
    setImportedCount(null);

    const response = await fetch("/api/posts/topics/sync-artur", { method: "POST" });

    setRefreshing(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setRefreshError(data?.error === "artur_unreachable" ? "unreachable" : "generic");
      return;
    }

    const data = (await response.json()) as { imported: { id: string; title: string }[] };
    setImportedCount(data.imported.length);
    if (data.imported.length > 0) router.refresh();
  }

  function handleMediaSaved() {
    setMediaFormMode(null);
    router.refresh();
  }

  function handleTopicSaved() {
    setTopicFormMode(null);
    router.refresh();
  }

  function toggleGenerate(mediaId: string) {
    setExpandedMediaId((current) => (current === mediaId ? null : mediaId));
  }

  function toggleHistory(topicId: string) {
    setExpandedHistoryTopicId((current) => (current === topicId ? null : topicId));
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center space-y-6">
      <PageHeading
        title={
          <span className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" aria-hidden="true" />
            {getTranslation(postsTranslations.title, language)}
          </span>
        }
      />

      <div className="flex w-full items-start gap-2 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <p>{getTranslation(postsTranslations.tokenCostNotice, language)}</p>
      </div>

      <section className="w-full space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Radio className="h-4 w-4 text-primary" aria-hidden="true" />
            {getTranslation(postsTranslations.mediaSectionTitle, language)}
          </h2>
          {isSuperuser && (
            <Button size="sm" variant="outline" onClick={() => setMediaFormMode("create")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {getTranslation(postsTranslations.addMedia, language)}
            </Button>
          )}
        </div>

        {isSuperuser && mediaFormMode && (
          <PostMediaForm
            language={language}
            initialValues={mediaFormMode === "create" ? undefined : mediaFormMode}
            onCancel={() => setMediaFormMode(null)}
            onSaved={handleMediaSaved}
            onDeleted={handleMediaSaved}
          />
        )}

        {media.length === 0 ? (
          <Card className="w-full">
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">{getTranslation(postsTranslations.emptyMedia, language)}</p>
            </CardContent>
          </Card>
        ) : (
          media.map((medium) => (
            <Card key={medium.id} className="w-full">
              <CardHeader className="flex-row flex-wrap items-start justify-between gap-2 space-y-0 py-3">
                <CardTitle className="min-w-0 flex-1 break-words text-base">{medium.name}</CardTitle>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant={expandedMediaId === medium.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleGenerate(medium.id)}
                  >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    {getTranslation(postsTranslations.generate, language)}
                  </Button>
                  {isSuperuser && (
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMediaFormMode(medium)}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">{getTranslation(postsTranslations.editMedia, language)}</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              {expandedMediaId === medium.id && (
                <CardContent className="pt-0">
                  <GenerateForMediaPanel language={language} mediaId={medium.id} />
                </CardContent>
              )}
            </Card>
          ))
        )}
      </section>

      <section className="w-full space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Newspaper className="h-4 w-4 text-primary" aria-hidden="true" />
            {getTranslation(postsTranslations.topicsSectionTitle, language)}
          </h2>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={handleRefreshFromArtur} disabled={refreshing}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {getTranslation(refreshing ? postsTranslations.refreshingTopics : postsTranslations.refreshTopics, language)}
            </Button>
            {isSuperuser && (
              <Button size="sm" variant="outline" onClick={() => setTopicFormMode("create")}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {getTranslation(postsTranslations.addTopic, language)}
              </Button>
            )}
          </div>
        </div>

        {refreshError && (
          <p className="text-xs text-destructive">
            {getTranslation(
              refreshError === "unreachable" ? postsTranslations.arturUnreachable : postsTranslations.generationError,
              language
            )}
          </p>
        )}
        {importedCount !== null && !refreshError && (
          <p className="text-xs text-muted-foreground">
            {importedCount === 0
              ? getTranslation(postsTranslations.noNewTopics, language)
              : `${importedCount} ${getTranslation(postsTranslations.newTopicsImportedSuffix, language)}`}
          </p>
        )}

        {isSuperuser && topicFormMode && (
          <PostTopicForm
            language={language}
            initialValues={topicFormMode === "create" ? undefined : topicFormMode}
            onCancel={() => setTopicFormMode(null)}
            onSaved={handleTopicSaved}
            onDeleted={handleTopicSaved}
          />
        )}

        {topics.length === 0 ? (
          <Card className="w-full">
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">{getTranslation(postsTranslations.empty, language)}</p>
            </CardContent>
          </Card>
        ) : (
          topics.map((topic) => (
            <Card key={topic.id} className="w-full">
              <CardHeader className="flex-row flex-wrap items-start justify-between gap-2 space-y-0 py-3">
                <CardTitle
                  className={cn(
                    "flex min-w-0 flex-1 flex-wrap items-center gap-2 break-words text-base",
                    topic.documents.length === 0 && "font-normal"
                  )}
                >
                  {topic.title}
                  {topic.arturSlug && (
                    <Badge variant="outline" className="shrink-0 font-normal">
                      {getTranslation(postsTranslations.importedFromArtur, language)}
                    </Badge>
                  )}
                  {topic.documents.length > 0 && (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-normal text-muted-foreground">
                      <FileText className="h-3 w-3" aria-hidden="true" />
                      {topic.documents.length}
                    </span>
                  )}
                </CardTitle>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant={expandedHistoryTopicId === topic.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleHistory(topic.id)}
                  >
                    <History className="h-3.5 w-3.5" aria-hidden="true" />
                    {getTranslation(postsTranslations.history, language)}
                  </Button>
                  {isSuperuser && (
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setTopicFormMode(topic)}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">{getTranslation(postsTranslations.editTopic, language)}</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              {expandedHistoryTopicId === topic.id && (
                <CardContent className="pt-0">
                  <TopicHistory language={language} topicId={topic.id} />
                </CardContent>
              )}
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
