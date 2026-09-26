import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, UnauthorizedError } from "@/lib/auth/requireSession";
import { generateSocialPostText, NotConfiguredError } from "@/lib/posts/generateText";

// How many of the topic's own saved generations are fed back to the LLM as
// anti-repetition context, regardless of which medium they were written
// for. Older ones stop being relevant well before this, and keeping the
// list short bounds the prompt size.
const PREVIOUS_GENERATIONS_CONTEXT_LIMIT = 20;

/**
 * Generates a draft post text for the topic, targeting the given medium,
 * grounded in the topic's reference documents and steered away from
 * repeating a generation already saved for this topic on ANY medium.
 * Ephemeral: nothing is persisted here. The employee reviews/edits the
 * draft client-side and explicitly saves it via
 * POST /api/posts/topics/[id]/generations to add it to the history. Open
 * to any employee. Returns 503 "not_configured" when no LLM provider is
 * wired in yet (see lib/posts/generateText.ts).
 */
export async function POST(request: Request, { params }: RouteContext<"/api/posts/topics/[id]/generate">) {
  try {
    await requireEmployee();
    const { id } = await params;

    const topic = await withPrisma((prisma) => prisma.postTopic.findUnique({ where: { id } }));
    if (!topic) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as { mediaId?: unknown } | null;
    const mediaId = typeof body?.mediaId === "string" ? body.mediaId : "";
    if (!mediaId) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const medium = await withPrisma((prisma) => prisma.postMedia.findUnique({ where: { id: mediaId } }));
    if (!medium) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const [documents, previousGenerations] = await Promise.all([
      withPrisma((prisma) =>
        prisma.postDocument.findMany({ where: { topicId: id }, select: { filename: true, content: true } })
      ),
      withPrisma((prisma) =>
        prisma.postGeneration.findMany({
          where: { topicId: id },
          orderBy: { createdAt: "desc" },
          take: PREVIOUS_GENERATIONS_CONTEXT_LIMIT,
          select: { content: true },
        })
      ),
    ]);

    const content = await generateSocialPostText({
      topicTitle: topic.title,
      mediaName: medium.name,
      referenceDocuments: documents,
      previousGenerations: previousGenerations.map((generation) => generation.content),
    });

    return NextResponse.json({ content });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (error instanceof NotConfiguredError) {
      return NextResponse.json({ error: "not_configured" }, { status: 503 });
    }
    throw error;
  }
}
