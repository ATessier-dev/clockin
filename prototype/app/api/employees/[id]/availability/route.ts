import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

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

type AvailabilityInput = { dayOfWeek: DayOfWeek; workplaceId: string };

function parseAvailabilities(value: unknown): AvailabilityInput[] | null {
  if (!Array.isArray(value)) return null;

  const seen = new Set<string>();
  const result: AvailabilityInput[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") return null;
    const { dayOfWeek, workplaceId } = entry as Record<string, unknown>;
    if (typeof workplaceId !== "string" || !workplaceId) return null;
    if (!DAYS_OF_WEEK.includes(dayOfWeek as DayOfWeek)) return null;

    // De-dupe defensively — the unique constraint would reject a repeat
    // pair anyway, but failing the whole save on a client-side glitch
    // (double-click, stale state) isn't worth it.
    const key = `${dayOfWeek}:${workplaceId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ dayOfWeek: dayOfWeek as DayOfWeek, workplaceId });
  }
  return result;
}

// Replaces an employee's full availability set in one call — the client
// always sends its complete current selection, so this deletes what's no
// longer selected and (re)creates what is, in a single transaction.
export async function PUT(request: Request, { params }: RouteContext<"/api/employees/[id]/availability">) {
  try {
    const session = await requireEmployee();
    const { id } = await params;
    const isSelf = session.employeeId === id;
    const isSuperuser = session.role === "SUPERUSER";

    if (!isSelf && !isSuperuser) {
      throw new ForbiddenError();
    }

    const body = (await request.json().catch(() => null)) as { availabilities?: unknown } | null;
    const availabilities = parseAvailabilities(body?.availabilities);
    if (!availabilities) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    await withPrisma((prisma) =>
      prisma.$transaction([
        prisma.employeeAvailability.deleteMany({ where: { employeeId: id } }),
        prisma.employeeAvailability.createMany({
          data: availabilities.map((a) => ({ employeeId: id, dayOfWeek: a.dayOfWeek, workplaceId: a.workplaceId })),
        }),
      ])
    );

    return NextResponse.json({ availabilities });
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
