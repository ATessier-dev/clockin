import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

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

export async function GET() {
  try {
    await requireEmployee();

    const dailyMeetings = await withPrisma((prisma) =>
      prisma.dailyMeeting.findMany({
        orderBy: [{ time: "asc" }, { sortOrder: "asc" }],
        include: { workplace: { select: { label: true, color: true } } },
      })
    );

    return NextResponse.json({ dailyMeetings });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperuser();

    const body = (await request.json().catch(() => null)) as {
      name?: unknown;
      time?: unknown;
      days?: unknown;
      workplaceId?: unknown;
    } | null;

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const time = typeof body?.time === "string" && TIME_PATTERN.test(body.time) ? body.time : "";
    const days = parseDays(body?.days);
    const workplaceId = typeof body?.workplaceId === "string" ? body.workplaceId : "";

    if (!name || !time || !days || !workplaceId) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const lastMeeting = await withPrisma((prisma) =>
      prisma.dailyMeeting.findFirst({ orderBy: { sortOrder: "desc" } })
    );

    const dailyMeeting = await withPrisma((prisma) =>
      prisma.dailyMeeting.create({
        data: { name, time, days, workplaceId, sortOrder: (lastMeeting?.sortOrder ?? -1) + 1 },
        include: { workplace: { select: { label: true, color: true } } },
      })
    );

    return NextResponse.json({ dailyMeeting }, { status: 201 });
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
