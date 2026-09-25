import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

/** Updates a post item's title and/or category. Superuser only; 404 if the item doesn't exist. */
export async function PATCH(request: Request, { params }: RouteContext<"/api/posts/items/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.postItem.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as { title?: unknown; categoryId?: unknown } | null;
    const title = typeof body?.title === "string" ? body.title.trim() || undefined : undefined;
    const categoryId =
      body?.categoryId === null || typeof body?.categoryId === "string" ? body.categoryId || null : undefined;

    if (body && "title" in body && !title) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    if (categoryId) {
      const category = await withPrisma((prisma) => prisma.postCategory.findUnique({ where: { id: categoryId } }));
      if (!category) {
        return NextResponse.json({ error: "invalid_body" }, { status: 400 });
      }
    }

    const item = await withPrisma((prisma) =>
      prisma.postItem.update({
        where: { id },
        data: { title, categoryId },
        include: { documents: { select: { id: true, filename: true, createdAt: true } } },
      })
    );

    return NextResponse.json({ item });
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

// Deleting an item cascades to its PostDocument and PostGeneration rows
// (see their onDelete: Cascade): reference material and generated history
// for a removed topic have no reason to survive it.
export async function DELETE(request: Request, { params }: RouteContext<"/api/posts/items/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.postItem.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await withPrisma((prisma) => prisma.postItem.delete({ where: { id } }));

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
