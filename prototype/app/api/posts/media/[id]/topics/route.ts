import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, UnauthorizedError } from "@/lib/auth/requireSession";

/**
 * Lists every topic, each annotated with whether (and when) this specific
 * medium already has a saved generation for it. Feeds the "to do" /
 * "already done" picker shown when generating for a medium. Any
 * authenticated employee can read it.
 */
export async function GET(request: Request, { params }: RouteContext<"/api/posts/media/[id]/topics">) {
  try {
    await requireEmployee();
    const { id } = await params;

    const medium = await withPrisma((prisma) => prisma.postMedia.findUnique({ where: { id } }));
    if (!medium) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const topics = await withPrisma((prisma) =>
      prisma.postTopic.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          generations: {
            where: { mediaId: id },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
        },
      })
    );

    return NextResponse.json({
      topics: topics.map((topic) => ({
        id: topic.id,
        title: topic.title,
        lastGeneratedAt: topic.generations[0]?.createdAt ?? null,
      })),
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
