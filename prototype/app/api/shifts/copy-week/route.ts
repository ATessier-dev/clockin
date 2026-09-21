import { NextResponse } from "next/server";
import { startOfWeek, endOfWeek } from "date-fns";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

// Copies every shift from the source week into the target week, shifted by
// whole weeks so day-of-week and time-of-day are preserved. Purely additive:
// only creates rows, never touches shifts already in the target week.
export async function POST(request: Request) {
  try {
    await requireSuperuser();

    const body = (await request.json().catch(() => null)) as {
      sourceWeekStart?: unknown;
      targetWeekStart?: unknown;
    } | null;

    const sourceWeekStartRaw = typeof body?.sourceWeekStart === "string" ? new Date(body.sourceWeekStart) : null;
    const targetWeekStartRaw = typeof body?.targetWeekStart === "string" ? new Date(body.targetWeekStart) : null;

    if (
      !sourceWeekStartRaw ||
      !targetWeekStartRaw ||
      Number.isNaN(sourceWeekStartRaw.getTime()) ||
      Number.isNaN(targetWeekStartRaw.getTime())
    ) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const sourceStart = startOfWeek(sourceWeekStartRaw, { weekStartsOn: 1 });
    const sourceEnd = endOfWeek(sourceWeekStartRaw, { weekStartsOn: 1 });
    const targetStart = startOfWeek(targetWeekStartRaw, { weekStartsOn: 1 });
    const offsetMs = targetStart.getTime() - sourceStart.getTime();

    if (offsetMs === 0) {
      return NextResponse.json({ error: "same_week" }, { status: 400 });
    }

    const sourceShifts = await withPrisma((prisma) =>
      prisma.shift.findMany({
        where: { startAt: { gte: sourceStart, lte: sourceEnd } },
      })
    );

    const createdShifts = sourceShifts.length
      ? await withPrisma((prisma) =>
          prisma.$transaction(
            sourceShifts.map((shift) =>
              prisma.shift.create({
                data: {
                  employeeId: shift.employeeId,
                  workplaceId: shift.workplaceId,
                  startAt: new Date(shift.startAt.getTime() + offsetMs),
                  endAt: new Date(shift.endAt.getTime() + offsetMs),
                },
              })
            )
          )
        )
      : [];

    return NextResponse.json({ copiedCount: createdShifts.length }, { status: 201 });
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
