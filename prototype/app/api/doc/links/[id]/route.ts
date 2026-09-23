import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

export async function PATCH(request: Request, { params }: RouteContext<"/api/doc/links/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.docLink.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as {
      title?: unknown;
      url?: unknown;
      description?: unknown;
      categoryId?: unknown;
    } | null;

    const title = typeof body?.title === "string" ? body.title.trim() || undefined : undefined;
    const url = typeof body?.url === "string" ? body.url.trim() || undefined : undefined;
    const description =
      typeof body?.description === "string" ? body.description.trim() || null : undefined;
    const categoryId =
      body?.categoryId === null || typeof body?.categoryId === "string" ? body.categoryId || null : undefined;

    if (categoryId) {
      const category = await withPrisma((prisma) => prisma.docCategory.findUnique({ where: { id: categoryId } }));
      if (!category) {
        return NextResponse.json({ error: "invalid_body" }, { status: 400 });
      }
    }

    const link = await withPrisma((prisma) =>
      prisma.docLink.update({ where: { id }, data: { title, url, description, categoryId } })
    );

    return NextResponse.json({ link });
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

export async function DELETE(request: Request, { params }: RouteContext<"/api/doc/links/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.docLink.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await withPrisma((prisma) => prisma.docLink.delete({ where: { id } }));

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
