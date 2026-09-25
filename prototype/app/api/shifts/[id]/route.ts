import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import {
  requireEmployee,
  requireSuperuser,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth/requireSession";

/** Fetches a single shift by id. Any authenticated employee can read it. */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/shifts/[id]">
) {
  try {
    await requireEmployee();
    const { id } = await params;

    const shift = await withPrisma((prisma) => prisma.shift.findUnique({ where: { id } }));

    if (!shift) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ shift });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}

/** Updates a shift's assignment or time range. Superuser only; 400 if end is not after start. */
export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/shifts/[id]">
) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const body = (await request.json().catch(() => null)) as {
      employeeId?: unknown;
      workplaceId?: unknown;
      positionId?: unknown;
      startAt?: unknown;
      endAt?: unknown;
    } | null;

    const existing = await withPrisma((prisma) => prisma.shift.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const employeeId = typeof body?.employeeId === "string" ? body.employeeId : undefined;
    const workplaceId = typeof body?.workplaceId === "string" ? body.workplaceId : undefined;
    const positionId = typeof body?.positionId === "string" ? body.positionId : undefined;
    const startAt = typeof body?.startAt === "string" ? new Date(body.startAt) : undefined;
    const endAt = typeof body?.endAt === "string" ? new Date(body.endAt) : undefined;

    if (
      (startAt && Number.isNaN(startAt.getTime())) ||
      (endAt && Number.isNaN(endAt.getTime()))
    ) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const nextStartAt = startAt ?? existing.startAt;
    const nextEndAt = endAt ?? existing.endAt;
    if (nextEndAt <= nextStartAt) {
      return NextResponse.json({ error: "end_before_start" }, { status: 400 });
    }

    const shift = await withPrisma((prisma) =>
      prisma.shift.update({
        where: { id },
        data: { employeeId, workplaceId, positionId, startAt, endAt },
      })
    );

    return NextResponse.json({ shift });
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

/** Deletes a shift. Superuser only; 404 if the shift doesn't exist. */
export async function DELETE(
  request: Request,
  { params }: RouteContext<"/api/shifts/[id]">
) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.shift.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await withPrisma((prisma) => prisma.shift.delete({ where: { id } }));

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
