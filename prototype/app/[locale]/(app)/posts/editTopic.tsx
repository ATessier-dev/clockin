"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Trash2, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTranslation, postsTranslations, type Language } from "@/translations";

export type PostDocumentEntry = {
  id: string;
  filename: string;
  createdAt: string;
};

export type PostTopicEntry = {
  id: string;
  title: string;
  arturSlug: string | null;
  documents: PostDocumentEntry[];
};

/**
 * Create/edit form for a post topic (title), plus, once the topic exists,
 * its .txt reference documents (list with delete, upload input). A topic
 * isn't tied to any one medium: the same topic can later be generated for
 * several. Document uploads apply immediately and don't require submitting
 * the form.
 */
export function PostTopicForm({
  language,
  initialValues,
  onCancel,
  onSaved,
  onDeleted,
}: {
  language: Language;
  initialValues?: PostTopicEntry;
  onCancel: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [documents, setDocuments] = useState<PostDocumentEntry[]>(initialValues?.documents ?? []);
  const [error, setError] = useState(false);
  const [documentError, setDocumentError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = Boolean(initialValues);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(false);

    const response = await fetch(isEditing ? `/api/posts/topics/${initialValues!.id}` : "/api/posts/topics", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError(true);
      return;
    }

    onSaved();
  }

  async function handleDelete() {
    if (!initialValues) return;
    setSubmitting(true);
    setError(false);

    const response = await fetch(`/api/posts/topics/${initialValues.id}`, { method: "DELETE" });

    setSubmitting(false);

    if (!response.ok) {
      setError(true);
      return;
    }

    onDeleted();
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !initialValues) return;

    setUploading(true);
    setDocumentError(false);

    const formData = new FormData();
    formData.set("file", file);

    const response = await fetch(`/api/posts/topics/${initialValues.id}/documents`, {
      method: "POST",
      body: formData,
    });

    setUploading(false);

    if (!response.ok) {
      setDocumentError(true);
      return;
    }

    const data = (await response.json()) as { document: PostDocumentEntry };
    setDocuments((current) => [...current, data.document]);
  }

  async function handleDeleteDocument(documentId: string) {
    if (!initialValues) return;
    setDocumentError(false);

    const response = await fetch(`/api/posts/topics/${initialValues.id}/documents/${documentId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setDocumentError(true);
      return;
    }

    setDocuments((current) => current.filter((document) => document.id !== documentId));
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="space-y-1">
        <Label htmlFor="post-topic-title">{getTranslation(postsTranslations.titleLabel, language)}</Label>
        <Input id="post-topic-title" value={title} onChange={(event) => setTitle(event.target.value)} required autoFocus />
      </div>

      {error && <p className="text-xs text-destructive">{getTranslation(postsTranslations.saveError, language)}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        {isEditing && (
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={submitting}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {getTranslation(postsTranslations.deleteTopic, language)}
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          {getTranslation(postsTranslations.cancel, language)}
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {getTranslation(postsTranslations.save, language)}
        </Button>
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <Label>{getTranslation(postsTranslations.documentsLabel, language)}</Label>

        {isEditing ? (
          <>
            {documents.length > 0 && (
              <ul className="space-y-1">
                {documents.map((document) => (
                  <li key={document.id} className="flex items-center gap-2 text-sm">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="flex-1 truncate">{document.filename}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDeleteDocument(document.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">{getTranslation(postsTranslations.deleteDocument, language)}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,text/plain"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {getTranslation(postsTranslations.addDocument, language)}
            </Button>

            {documentError && (
              <p className="text-xs text-destructive">{getTranslation(postsTranslations.invalidDocument, language)}</p>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">{getTranslation(postsTranslations.documentsHint, language)}</p>
        )}
      </div>
    </form>
  );
}
