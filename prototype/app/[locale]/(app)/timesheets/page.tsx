import { startOfDay, endOfDay } from 'date-fns';
import { getSession } from '@/lib/auth/session';
import { withPrisma } from '@/lib/withPrisma';
import { redirect } from '@/i18n/navigation';
import { type Language } from '@/translations';
import { TimesheetsView } from './timesheetsView';
import { ActiveStatusCard, type ActiveEmployee } from './activeStatus';
import { ExpectedStatusCard, type ExpectedEmployee } from './expectedStatus';

export default async function TimesheetsPage({ params, searchParams }: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ employeeId?: string; day?: string }>;
}) {
    const { locale } = await params;
    const { employeeId, day } = await searchParams;
    const language = (locale === "en" ? "en" : "fr") as Language;

    const sessionUser = await getSession();
    if (!sessionUser) return null;
    if (sessionUser.role !== "SUPERUSER") {
        redirect({ href: "/dashboard", locale });
    }

    const employees = await withPrisma((prisma) =>
        prisma.employee.findMany({
            where: { active: true },
            orderBy: { firstName: "asc" },
            select: { id: true, firstName: true, lastName: true },
        })
    );

    const workplaces = await withPrisma((prisma) =>
        prisma.workplace.findMany({
            orderBy: { label: "asc" },
            select: { id: true, label: true },
        })
    );

    // One indexed query per active employee (small team size, matches the
    // pattern in lib/clock/recordClockEvent.ts's getLatestClockEvent) rather
    // than scanning the whole clock_events history for a "latest per group".
    const latestClockEvents = await Promise.all(
        employees.map((employee) =>
            withPrisma((prisma) =>
                prisma.clockEvent.findFirst({
                    where: { employeeId: employee.id },
                    orderBy: { at: "desc" },
                    select: { type: true, at: true, workplace: { select: { label: true, color: true } } },
                })
            )
        )
    );

    const activeEmployees: ActiveEmployee[] = employees.flatMap((employee, index) => {
        const latest = latestClockEvents[index];
        if (latest?.type !== "CLOCK_IN") return [];
        return [{
            employeeId: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            since: latest.at,
            workplace: latest.workplace,
        }];
    });

    const activeEmployeeIds = new Set(activeEmployees.map((employee) => employee.employeeId));

    const now = new Date();
    const scheduledShiftsNow = await withPrisma((prisma) =>
        prisma.shift.findMany({
            where: {
                startAt: { lte: now },
                endAt: { gte: now },
                employee: { active: true },
            },
            select: {
                employeeId: true,
                employee: { select: { firstName: true, lastName: true } },
                workplace: { select: { label: true, color: true } },
            },
        })
    );

    const expectedEmployees: ExpectedEmployee[] = scheduledShiftsNow.map((shift) => ({
        employeeId: shift.employeeId,
        firstName: shift.employee.firstName,
        lastName: shift.employee.lastName,
        workplace: shift.workplace,
        isClockedIn: activeEmployeeIds.has(shift.employeeId),
    }));

    const selectedEmployeeId = employeeId ?? employees[0]?.id ?? "";

    const requestedDate = day ? new Date(day) : new Date();
    const referenceDate = Number.isNaN(requestedDate.getTime()) ? new Date() : requestedDate;
    const dayStart = startOfDay(referenceDate);
    const dayEnd = endOfDay(referenceDate);

    const clockEvents = selectedEmployeeId
        ? await withPrisma((prisma) =>
              prisma.clockEvent.findMany({
                  where: {
                      employeeId: selectedEmployeeId,
                      at: { gte: dayStart, lte: dayEnd },
                  },
                  orderBy: { at: "asc" },
                  select: {
                      id: true,
                      type: true,
                      at: true,
                      note: true,
                      workplaceId: true,
                      workplace: { select: { label: true, color: true } },
                  },
              })
          )
        : [];

    return (
        <main className="flex flex-col items-center gap-4 p-4">
            <div className="mx-auto flex w-full max-w-md flex-col gap-4">
                <ExpectedStatusCard language={language} expectedEmployees={expectedEmployees} />
                <ActiveStatusCard language={language} activeEmployees={activeEmployees} />
            </div>
            <TimesheetsView
                key={`${selectedEmployeeId}-${dayStart.toISOString()}`}
                language={language}
                employees={employees}
                workplaces={workplaces}
                selectedEmployeeId={selectedEmployeeId}
                dayStartIso={dayStart.toISOString()}
                entries={clockEvents}
            />
        </main>
    );
}
