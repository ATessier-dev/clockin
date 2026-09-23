import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;
type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

function parseDays(value: unknown): DayOfWeek[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const days = [...new Set(value)];
  return days.every((day): day is DayOfWeek => DAYS_OF_WEEK.includes(day as DayOfWeek)) ? days : null;
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/daily-meetings/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.dailyMeeting.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as {
      name?: unknown;
      time?: unknown;
      days?: unknown;
      workplaceId?: unknown;
    } | null;

    const name = typeof body?.name === "string" ? body.name.trim() || undefined : undefined;
    const time = typeof body?.time === "string" && TIME_PATTERN.test(body.time) ? body.time : undefined;
    const days = body && "days" in body ? parseDays(body.days) : undefined;
    const workplaceId = typeof body?.workplaceId === "string" ? body.workplaceId || undefined : undefined;

    if (body && "days" in body && !days) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const dailyMeeting = await withPrisma((prisma) =>
      prisma.dailyMeeting.update({
        where: { id },
        data: { name, time, days: days ?? undefined, workplaceId },
        include: { workplace: { select: { label: true, color: true } } },
      })
    );

    return NextResponse.json({ dailyMeeting });
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

export async function DELETE(request: Request, { params }: RouteContext<"/api/daily-meetings/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.dailyMeeting.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await withPrisma((prisma) => prisma.dailyMeeting.delete({ where: { id } }));

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
