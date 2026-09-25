import { NextRequest, NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import {
  requireEmployee,
  requireSuperuser,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth/requireSession";

/** Lists shifts, optionally filtered by employee, workplace, and/or date range. Any authenticated employee can read them. */
export async function GET(request: NextRequest) {
  try {
    await requireEmployee();

    const { searchParams } = request.nextUrl;
    const employeeId = searchParams.get("employeeId");
    const workplaceId = searchParams.get("workplaceId");
    const startAtFrom = searchParams.get("startAtFrom");
    const startAtTo = searchParams.get("startAtTo");

    const shifts = await withPrisma((prisma) =>
      prisma.shift.findMany({
        where: {
          ...(employeeId && { employeeId }),
          ...(workplaceId && { workplaceId }),
          ...((startAtFrom || startAtTo) && {
            startAt: {
              ...(startAtFrom && { gte: new Date(startAtFrom) }),
              ...(startAtTo && { lte: new Date(startAtTo) }),
            },
          }),
        },
        orderBy: { startAt: "asc" },
        include: {
          employee: { select: { firstName: true, lastName: true } },
          workplace: { select: { label: true, color: true } },
          position: { select: { name: true, color: true } },
        },
      })
    );

    return NextResponse.json({ shifts });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}

/** Creates a shift. Superuser only; 400 if end is not after start. */
export async function POST(request: Request) {
  try {
    await requireSuperuser();

    const body = (await request.json().catch(() => null)) as {
      employeeId?: unknown;
      workplaceId?: unknown;
      positionId?: unknown;
      startAt?: unknown;
      endAt?: unknown;
    } | null;

    const employeeId = typeof body?.employeeId === "string" ? body.employeeId : "";
    const workplaceId = typeof body?.workplaceId === "string" ? body.workplaceId : "";
    const positionId = typeof body?.positionId === "string" ? body.positionId : "";
    const startAt = typeof body?.startAt === "string" ? new Date(body.startAt) : null;
    const endAt = typeof body?.endAt === "string" ? new Date(body.endAt) : null;

    if (
      !employeeId ||
      !workplaceId ||
      !positionId ||
      !startAt ||
      !endAt ||
      Number.isNaN(startAt.getTime()) ||
      Number.isNaN(endAt.getTime())
    ) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    if (endAt <= startAt) {
      return NextResponse.json({ error: "end_before_start" }, { status: 400 });
    }

    const shift = await withPrisma((prisma) =>
      prisma.shift.create({
        data: { employeeId, workplaceId, positionId, startAt, endAt },
      })
    );

    return NextResponse.json({ shift }, { status: 201 });
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
