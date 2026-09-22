import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, UnauthorizedError } from "@/lib/auth/requireSession";
import { getClientIp } from "@/lib/clock/getClientIp";
import { matchWorkplace } from "@/lib/clock/matchWorkplace";
import {
  recordClockIn,
  recordClockOut,
  OpenClockEventConflictError,
  NoOpenClockEventError,
} from "@/lib/clock/recordClockEvent";

export async function POST(request: Request) {
  try {
    const session = await requireEmployee();

    const body = (await request.json().catch(() => null)) as { type?: unknown } | null;
    if (body?.type !== "CLOCK_IN" && body?.type !== "CLOCK_OUT") {
      return NextResponse.json({ error: "invalid_type" }, { status: 400 });
    }
    const type = body.type;

    // No longer gated on being on a workplace's network — clock in/out is
    // allowed from anywhere. The workplace is still recorded when it can be
    // inferred, so timesheets/reporting keep working: matched by IP first,
    // falling back to the employee's preferred workplace.
    const ip = getClientIp(request);
    const workplaces = await withPrisma((prisma) =>
      prisma.workplace.findMany({ select: { id: true, allowedCidr: true } })
    );
    const matchedWorkplace = matchWorkplace(ip, workplaces);

    let workplaceId = matchedWorkplace?.id ?? null;
    if (!workplaceId) {
      const employee = await withPrisma((prisma) =>
        prisma.employee.findUnique({
          where: { id: session.employeeId },
          select: { preferredWorkplaceId: true },
        })
      );
      workplaceId = employee?.preferredWorkplaceId ?? null;
    }

    const clockEvent =
      type === "CLOCK_IN"
        ? await recordClockIn({ employeeId: session.employeeId, workplaceId, ip })
        : await recordClockOut({ employeeId: session.employeeId, workplaceId, ip });

    return NextResponse.json({ clockEvent }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (error instanceof OpenClockEventConflictError) {
      return NextResponse.json({ error: "already_clocked_in" }, { status: 409 });
    }
    if (error instanceof NoOpenClockEventError) {
      return NextResponse.json({ error: "not_clocked_in" }, { status: 409 });
    }
    throw error;
  }
}
