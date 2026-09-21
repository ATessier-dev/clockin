import { NextRequest, NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

// Placeholder for manual/corrected rows — `ip` is required by the schema
// (real clock-ins always have one), but a superuser adding or fixing a
// record by hand has no real network context.
const MANUAL_IP_PLACEHOLDER = "manual";

export async function GET(request: NextRequest) {
  try {
    await requireSuperuser();

    const { searchParams } = request.nextUrl;
    const employeeId = searchParams.get("employeeId");
    const startAtFrom = searchParams.get("startAtFrom");
    const startAtTo = searchParams.get("startAtTo");

    if (!employeeId) {
      return NextResponse.json({ error: "employee_id_required" }, { status: 400 });
    }

    const clockEvents = await withPrisma((prisma) =>
      prisma.clockEvent.findMany({
        where: {
          employeeId,
          ...((startAtFrom || startAtTo) && {
            at: {
              ...(startAtFrom && { gte: new Date(startAtFrom) }),
              ...(startAtTo && { lte: new Date(startAtTo) }),
            },
          }),
        },
        orderBy: { at: "asc" },
        include: { workplace: { select: { label: true } } },
      })
    );

    return NextResponse.json({ clockEvents });
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

export async function POST(request: Request) {
  try {
    const session = await requireSuperuser();

    const body = (await request.json().catch(() => null)) as {
      employeeId?: unknown;
      type?: unknown;
      at?: unknown;
      workplaceId?: unknown;
      note?: unknown;
    } | null;

    const employeeId = typeof body?.employeeId === "string" ? body.employeeId : "";
    const type = body?.type === "CLOCK_IN" || body?.type === "CLOCK_OUT" ? body.type : null;
    const at = typeof body?.at === "string" ? new Date(body.at) : null;
    const workplaceId = typeof body?.workplaceId === "string" && body.workplaceId ? body.workplaceId : null;
    const note = typeof body?.note === "string" && body.note.trim() ? body.note.trim() : null;

    if (!employeeId || !type || !at || Number.isNaN(at.getTime())) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const clockEvent = await withPrisma((prisma) =>
      prisma.clockEvent.create({
        data: {
          employeeId,
          type,
          at,
          workplaceId,
          note,
          ip: MANUAL_IP_PLACEHOLDER,
          source: "SUPERUSER_EDIT",
          editedByEmployeeId: session.employeeId,
        },
      })
    );

    return NextResponse.json({ clockEvent }, { status: 201 });
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
