import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, UnauthorizedError } from "@/lib/auth/requireSession";
import { generateSocialPostText, NotConfiguredError } from "@/lib/posts/generateText";

// How many of the item's own saved generations are fed back to the LLM as
// anti-repetition context. Older ones stop being relevant well before this,
// and keeping the list short bounds the prompt size.
const PREVIOUS_GENERATIONS_CONTEXT_LIMIT = 20;

/**
 * Generates a draft post text for the item, grounded in its reference
 * documents and steered away from repeating an already-saved generation.
 * Ephemeral: nothing is persisted here. The employee reviews/edits the
 * draft client-side and explicitly saves it via
 * POST /api/posts/items/[id]/generations to add it to the history. Open to
 * any employee. Returns 503 "not_configured" when no LLM provider is wired
 * in yet (see lib/posts/generateText.ts).
 */
export async function POST(request: Request, { params }: RouteContext<"/api/posts/items/[id]/generate">) {
  try {
    await requireEmployee();
    const { id } = await params;

    const item = await withPrisma((prisma) => prisma.postItem.findUnique({ where: { id } }));
    if (!item) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const [documents, previousGenerations] = await Promise.all([
      withPrisma((prisma) =>
        prisma.postDocument.findMany({ where: { itemId: id }, select: { filename: true, content: true } })
      ),
      withPrisma((prisma) =>
        prisma.postGeneration.findMany({
          where: { itemId: id },
          orderBy: { createdAt: "desc" },
          take: PREVIOUS_GENERATIONS_CONTEXT_LIMIT,
          select: { content: true },
        })
      ),
    ]);

    const content = await generateSocialPostText({
      itemTitle: item.title,
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
