import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

/** Renames a post topic. Superuser only; 404 if it doesn't exist. */
export async function PATCH(request: Request, { params }: RouteContext<"/api/posts/topics/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.postTopic.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as { title?: unknown } | null;
    const title = typeof body?.title === "string" ? body.title.trim() || undefined : undefined;

    if (body && "title" in body && !title) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const topic = await withPrisma((prisma) =>
      prisma.postTopic.update({
        where: { id },
        data: { title },
        include: { documents: { select: { id: true, filename: true, createdAt: true } } },
      })
    );

    return NextResponse.json({ topic });
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

// Deleting a topic cascades to its PostDocument and PostGeneration rows
// (see their onDelete: Cascade): reference material and generated history
// for a removed topic have no reason to survive it.
export async function DELETE(request: Request, { params }: RouteContext<"/api/posts/topics/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.postTopic.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await withPrisma((prisma) => prisma.postTopic.delete({ where: { id } }));

    return new NextResponse(null, { status: 204 });
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
