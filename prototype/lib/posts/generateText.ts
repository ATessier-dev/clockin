import fs from "fs";
import path from "path";
import OpenAI from "openai";

/** Thrown by generateSocialPostText when OPENAI_API_KEY isn't set. The route catches this and returns 503 "not_configured". */
export class NotConfiguredError extends Error {}

const DEFAULT_MODEL = "gpt-4o-mini";
const PROMPT_PATH = path.join(process.cwd(), "lib/posts/generationPrompt.md");

let client: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new NotConfiguredError();
  if (!client) client = new OpenAI({ apiKey });
  return client;
}

// generationPrompt.md opens with a human-facing explanation of the file's
// role, then a "---" separator before the actual system prompt: only the
// part after the separator is meant for the model.
function getSystemPrompt(): string {
  const raw = fs.readFileSync(PROMPT_PATH, "utf-8");
  const separatorIndex = raw.indexOf("\n---\n");
  return (separatorIndex === -1 ? raw : raw.slice(separatorIndex + 5)).trim();
}

function buildUserMessage(input: {
  topicTitle: string;
  mediaName: string;
  referenceDocuments: { filename: string; content: string }[];
  previousGenerations: string[];
}): string {
  const parts: string[] = [`Sujet : ${input.topicTitle}`, `Plateforme cible : ${input.mediaName}`];

  if (input.referenceDocuments.length > 0) {
    parts.push("Documents de référence :");
    for (const document of input.referenceDocuments) {
      parts.push(`--- ${document.filename} ---\n${document.content}`);
    }
  } else {
    parts.push("Aucun document de référence fourni.");
  }

  if (input.previousGenerations.length > 0) {
    parts.push("Textes déjà publiés pour ce sujet, à ne pas répéter :");
    input.previousGenerations.forEach((text, index) => parts.push(`${index + 1}. ${text}`));
  }

  return parts.join("\n\n");
}

/**
 * Generates a copy-paste-ready social media post for the given medium,
 * grounded in the topic's reference documents and steered away from
 * repeating a generation already saved for this topic on any medium.
 */
export async function generateSocialPostText(input: {
  topicTitle: string;
  mediaName: string;
  referenceDocuments: { filename: string; content: string }[];
  previousGenerations: string[];
}): Promise<string> {
  const completion = await getClient().chat.completions.create({
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    messages: [
      { role: "system", content: getSystemPrompt() },
      { role: "user", content: buildUserMessage(input) },
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("OpenAI returned an empty completion");
  return content;
}
