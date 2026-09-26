import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, UnauthorizedError } from "@/lib/auth/requireSession";

/** Lists a topic's saved generation history (newest first), across every medium. Any authenticated employee can read it. */
export async function GET(request: Request, { params }: RouteContext<"/api/posts/topics/[id]/generations">) {
  try {
    await requireEmployee();
    const { id } = await params;

    const generations = await withPrisma((prisma) =>
      prisma.postGeneration.findMany({
        where: { topicId: id },
        orderBy: { createdAt: "desc" },
        include: {
          media: { select: { id: true, name: true } },
          createdByEmployee: { select: { id: true, firstName: true, lastName: true } },
        },
      })
    );

    return NextResponse.json({ generations });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}

/**
 * Saves a post text to the topic's history for the given medium: the
 * final, possibly hand-edited version of a draft the employee generated
 * via POST /api/posts/topics/[id]/generate and approved. Doesn't call the
 * LLM; saving is what makes a text count as "already posted" for future
 * anti-repetition context (on any medium) and marks the topic as treated
 * for this medium. Open to any employee.
 */
export async function POST(request: Request, { params }: RouteContext<"/api/posts/topics/[id]/generations">) {
  try {
    const session = await requireEmployee();
    const { id } = await params;

    const topic = await withPrisma((prisma) => prisma.postTopic.findUnique({ where: { id } }));
    if (!topic) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as { mediaId?: unknown; content?: unknown } | null;
    const mediaId = typeof body?.mediaId === "string" ? body.mediaId : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!mediaId || !content) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const medium = await withPrisma((prisma) => prisma.postMedia.findUnique({ where: { id: mediaId } }));
    if (!medium) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const generation = await withPrisma((prisma) =>
      prisma.postGeneration.create({
        data: { topicId: id, mediaId, content, createdByEmployeeId: session.employeeId },
        include: {
          media: { select: { id: true, name: true } },
          createdByEmployee: { select: { id: true, firstName: true, lastName: true } },
        },
      })
    );

    return NextResponse.json({ generation }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
