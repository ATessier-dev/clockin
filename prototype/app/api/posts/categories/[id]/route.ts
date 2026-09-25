import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

/** Renames a post category. Superuser only; 404 if the category doesn't exist. */
export async function PATCH(request: Request, { params }: RouteContext<"/api/posts/categories/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.postCategory.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
    const name = typeof body?.name === "string" ? body.name.trim() || undefined : undefined;

    if (body && "name" in body && !name) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const category = await withPrisma((prisma) => prisma.postCategory.update({ where: { id }, data: { name } }));

    return NextResponse.json({ category });
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

// Deleting a category never deletes its items. PostItem.categoryId is
// onDelete: SetNull, so items simply become uncategorized.
export async function DELETE(request: Request, { params }: RouteContext<"/api/posts/categories/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.postCategory.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await withPrisma((prisma) => prisma.postCategory.delete({ where: { id } }));

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
