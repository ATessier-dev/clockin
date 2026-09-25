import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

/**
 * Edits a clock event's fields. Superuser only; marks the row as
 * `SUPERUSER_EDIT` and records the editor for audit purposes.
 */
export async function PATCH(request: Request, { params }: RouteContext<"/api/clock-events/[id]">) {
  try {
    const session = await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.clockEvent.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as {
      type?: unknown;
      at?: unknown;
      workplaceId?: unknown;
      note?: unknown;
    } | null;

    const type = body?.type === "CLOCK_IN" || body?.type === "CLOCK_OUT" ? body.type : undefined;
    const at = typeof body?.at === "string" ? new Date(body.at) : undefined;
    const workplaceId = typeof body?.workplaceId === "string" ? body.workplaceId || null : undefined;
    const note = typeof body?.note === "string" ? body.note.trim() || null : undefined;

    if (at && Number.isNaN(at.getTime())) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const clockEvent = await withPrisma((prisma) =>
      prisma.clockEvent.update({
        where: { id },
        data: {
          type,
          at,
          workplaceId,
          note,
          source: "SUPERUSER_EDIT",
          editedByEmployeeId: session.employeeId,
        },
      })
    );

    return NextResponse.json({ clockEvent });
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

/** Deletes a clock event. Superuser only; 404 if the event doesn't exist. */
export async function DELETE(request: Request, { params }: RouteContext<"/api/clock-events/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.clockEvent.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await withPrisma((prisma) => prisma.clockEvent.delete({ where: { id } }));

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
