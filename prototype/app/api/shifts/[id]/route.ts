import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import {
  requireEmployee,
  requireSuperuser,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth/requireSession";

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
      startAt?: unknown;
      endAt?: unknown;
    } | null;

    const existing = await withPrisma((prisma) => prisma.shift.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const employeeId = typeof body?.employeeId === "string" ? body.employeeId : undefined;
    const workplaceId = typeof body?.workplaceId === "string" ? body.workplaceId : undefined;
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
        data: { employeeId, workplaceId, startAt, endAt },
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
