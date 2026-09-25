import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

/**
 * Updates a gallery event. Superuser only; 400 if the resulting start/end
 * range is invalid or end is not after start.
 */
export async function PATCH(request: Request, { params }: RouteContext<"/api/events/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.galleryEvent.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as {
      title?: unknown;
      description?: unknown;
      startAt?: unknown;
      endAt?: unknown;
      workplaceId?: unknown;
    } | null;

    const title = typeof body?.title === "string" ? body.title.trim() || undefined : undefined;
    const description =
      typeof body?.description === "string" ? body.description.trim() || null : undefined;
    const startAt = typeof body?.startAt === "string" ? new Date(body.startAt) : undefined;
    const endAt = typeof body?.endAt === "string" ? new Date(body.endAt) : undefined;
    const workplaceId =
      body?.workplaceId === null || typeof body?.workplaceId === "string"
        ? body.workplaceId || null
        : undefined;

    if ((startAt && Number.isNaN(startAt.getTime())) || (endAt && Number.isNaN(endAt.getTime()))) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const nextStartAt = startAt ?? existing.startAt;
    const nextEndAt = endAt ?? existing.endAt;
    if (nextEndAt <= nextStartAt) {
      return NextResponse.json({ error: "end_before_start" }, { status: 400 });
    }

    const event = await withPrisma((prisma) =>
      prisma.galleryEvent.update({
        where: { id },
        data: { title, description, startAt, endAt, workplaceId },
        include: { workplace: { select: { label: true, color: true } } },
      })
    );

    return NextResponse.json({ event });
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

/** Deletes a gallery event. Superuser only; 404 if the event doesn't exist. */
export async function DELETE(request: Request, { params }: RouteContext<"/api/events/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.galleryEvent.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await withPrisma((prisma) => prisma.galleryEvent.delete({ where: { id } }));

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
