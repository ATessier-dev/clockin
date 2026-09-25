import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

/** Lists post topics with their reference documents. Any authenticated employee can read them. */
export async function GET() {
  try {
    await requireEmployee();

    const topics = await withPrisma((prisma) =>
      prisma.postTopic.findMany({
        orderBy: { sortOrder: "asc" },
        include: { documents: { select: { id: true, filename: true, createdAt: true } } },
      })
    );

    return NextResponse.json({ topics });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}

/** Creates a post topic appended at the end of the sort order. Superuser only. */
export async function POST(request: Request) {
  try {
    await requireSuperuser();

    const body = (await request.json().catch(() => null)) as { title?: unknown } | null;
    const title = typeof body?.title === "string" ? body.title.trim() : "";

    if (!title) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const lastTopic = await withPrisma((prisma) => prisma.postTopic.findFirst({ orderBy: { sortOrder: "desc" } }));

    const topic = await withPrisma((prisma) =>
      prisma.postTopic.create({
        data: { title, sortOrder: (lastTopic?.sortOrder ?? -1) + 1 },
        include: { documents: { select: { id: true, filename: true, createdAt: true } } },
      })
    );

    return NextResponse.json({ topic }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    throw error;
  }
}
