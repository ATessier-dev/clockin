import { withPrisma } from "@/lib/withPrisma";

export class OpenClockEventConflictError extends Error {
  constructor() {
    super("Employee already has an open clock-in");
    this.name = "OpenClockEventConflictError";
  }
}

export class NoOpenClockEventError extends Error {
  constructor() {
    super("Employee has no open clock-in to close");
    this.name = "NoOpenClockEventError";
  }
}

// "Clocked in" means the employee's most recent ClockEvent is a CLOCK_IN —
// hours worked are derived from IN/OUT pairs at read time, never stored.
export async function getLatestClockEvent(employeeId: string) {
  return withPrisma((prisma) =>
    prisma.clockEvent.findFirst({
      where: { employeeId },
      orderBy: { at: "desc" },
    })
  );
}

export async function recordClockIn(params: { employeeId: string; workplaceId: string; ip: string }) {
  const latest = await getLatestClockEvent(params.employeeId);
  if (latest?.type === "CLOCK_IN") {
    throw new OpenClockEventConflictError();
  }

  return withPrisma((prisma) =>
    prisma.clockEvent.create({
      data: {
        employeeId: params.employeeId,
        workplaceId: params.workplaceId,
        ip: params.ip,
        type: "CLOCK_IN",
        source: "EMPLOYEE_SELF",
      },
    })
  );
}

export async function recordClockOut(params: { employeeId: string; workplaceId: string; ip: string }) {
  const latest = await getLatestClockEvent(params.employeeId);
  if (latest?.type !== "CLOCK_IN") {
    throw new NoOpenClockEventError();
  }

  return withPrisma((prisma) =>
    prisma.clockEvent.create({
      data: {
        employeeId: params.employeeId,
        workplaceId: params.workplaceId,
        ip: params.ip,
        type: "CLOCK_OUT",
        source: "EMPLOYEE_SELF",
      },
    })
  );
}
