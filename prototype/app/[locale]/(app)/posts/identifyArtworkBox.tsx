"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, ScanSearch, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTranslation, postsTranslations, type Language } from "@/translations";

type IdentifyMatch = {
  productId: number;
  title: string;
  artistName: string | null;
  descriptionFr: string | null;
  descriptionEn: string | null;
};

type IdentifyResponse = {
  match: IdentifyMatch | null;
  similarity: number | null;
  threshold?: number;
};

// Downscales the photo client-side before upload: a phone photo (often
// 3-10 MB) is far more than a "low" detail vision call needs, and keeps
// the request comfortably under serverless body-size limits.
const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.8;

async function resizeImageForUpload(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
  if (!blob) return file;
  return new File([blob], "artwork.jpg", { type: "image/jpeg" });
}

/**
 * Upload-a-photo box for identifying an artur.art artwork by image. UI
 * shell only for now: POST /api/identify doesn't exist yet (see
 * image-rec.md), so any submission surfaces the generic error state until
 * the backend lands.
 */
export function IdentifyArtworkBox({ language }: { language: Language }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<IdentifyResponse | null>(null);
  const [error, setError] = useState<"invalid_file" | "generic" | null>(null);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;

    setResult(null);
    setError(null);

    if (!selected.type.startsWith("image/")) {
      setError("invalid_file");
      return;
    }

    const resized = await resizeImageForUpload(selected);
    setFile(resized);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(resized);
    });
  }

  function handleClear() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  }

  async function handleAnalyze() {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.set("file", file);

    const response = await fetch("/api/identify", { method: "POST", body: formData });

    setAnalyzing(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error === "invalid_file" ? "invalid_file" : "generic");
      return;
    }

    setResult((await response.json()) as IdentifyResponse);
  }

  const description = result?.match
    ? language === "en"
      ? result.match.descriptionEn
      : result.match.descriptionFr
    : null;

  return (
    <Card className="w-full">
      <CardHeader className="space-y-0 py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ScanSearch className="h-4 w-4 text-primary" aria-hidden="true" />
          {getTranslation(postsTranslations.identifySectionTitle, language)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <p className="text-xs text-muted-foreground">{getTranslation(postsTranslations.identifyHint, language)}</p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelected}
        />

        {previewUrl ? (
          <div className="space-y-3">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not a remote asset */}
              <img src={previewUrl} alt="" className="w-full rounded-md border border-border object-cover" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute right-2 top-2 h-7 w-7 bg-background/90"
                onClick={handleClear}
                disabled={analyzing}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">{getTranslation(postsTranslations.cancel, language)}</span>
              </Button>
            </div>
            <Button type="button" className="w-full" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ScanSearch className="h-4 w-4" aria-hidden="true" />}
              {getTranslation(analyzing ? postsTranslations.identifyAnalyzing : postsTranslations.identifyAnalyze, language)}
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            {getTranslation(postsTranslations.identifyUploadButton, language)}
          </Button>
        )}

        {error && (
          <p className="text-xs text-destructive">
            {getTranslation(
              error === "invalid_file" ? postsTranslations.identifyInvalidFile : postsTranslations.generationError,
              language
            )}
          </p>
        )}

        {result && (
          <div className="space-y-1 rounded-md border border-border bg-muted/50 p-3 text-sm">
            {result.match ? (
              <>
                <p className="font-medium">{result.match.title}</p>
                {result.match.artistName && (
                  <p className="text-xs text-muted-foreground">
                    {getTranslation(postsTranslations.identifyArtistLabel, language)} : {result.match.artistName}
                  </p>
                )}
                {description && <p className="text-xs">{description}</p>}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">{getTranslation(postsTranslations.identifyNoMatch, language)}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
