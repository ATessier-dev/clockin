import { startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { getSession } from '@/lib/auth/session';
import { withPrisma } from '@/lib/withPrisma';
import { type Language } from '@/translations';
import { ScheduleWeek } from './scheduleWeek';

/**
 * Server-rendered week view of the schedule. Loads the signed-in employee's
 * own shifts always, and the full roster/catalogs/team availability only
 * for superusers, since employees can't act on that data anyway.
 */
export default async function SchedulePage({params, searchParams} : {
    params: Promise<{locale: string}>;
    searchParams: Promise<{ week?: string }>;
}) {
    const { locale } = await params;
    const { week } = await searchParams;
    const language = (locale === "en" ? "en" : "fr") as Language;
    const sessionUser = await getSession();
    if (!sessionUser) return null;
    const isSuperuser = sessionUser.role === "SUPERUSER";

    const requestedDate = week ? new Date(week) : new Date();
    // Guard against a malformed or tampered `week` query param falling back
    // to an Invalid Date, which would break every date computation below.
    const referenceDate = Number.isNaN(requestedDate.getTime()) ? new Date() : requestedDate;
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const myShifts = await withPrisma((prisma) =>
        prisma.shift.findMany({
            where: {
                employeeId: sessionUser.employeeId,
                startAt: { gte: weekStart, lte: weekEnd },
            },
            orderBy: { startAt: "asc" },
            select: {
                id: true,
                employeeId: true,
                workplaceId: true,
                positionId: true,
                startAt: true,
                endAt: true,
                employee: { select: { firstName: true, lastName: true } },
                workplace: { select: { label: true, color: true } },
                position: { select: { name: true, color: true } },
            },
        })
    );

    // Skip these queries entirely for regular employees; they're only used
    // by the superuser-only shift form and team availability panel.
    const [employees, workplaces, positions, teamAvailabilities] = isSuperuser
        ? await Promise.all([
              withPrisma((prisma) =>
                  prisma.employee.findMany({
                      where: { active: true },
                      orderBy: { firstName: "asc" },
                      select: { id: true, firstName: true, lastName: true },
                  })
              ),
              withPrisma((prisma) =>
                  prisma.workplace.findMany({
                      orderBy: { label: "asc" },
                      select: { id: true, label: true, color: true },
                  })
              ),
              withPrisma((prisma) =>
                  prisma.position.findMany({
                      orderBy: { sortOrder: "asc" },
                      select: { id: true, name: true },
                  })
              ),
              withPrisma((prisma) =>
                  prisma.employeeAvailability.findMany({
                      where: { employee: { active: true } },
                      select: { employeeId: true, dayOfWeek: true, workplaceId: true },
                  })
              ),
          ])
        : [[], [], [], []];

    // Shown to every employee, not just the superuser who manages them.
    const [dailyMeetings, events] = await Promise.all([
        withPrisma((prisma) =>
            prisma.dailyMeeting.findMany({
                orderBy: [{ time: "asc" }, { sortOrder: "asc" }],
                select: {
                    id: true,
                    name: true,
                    time: true,
                    days: true,
                    workplace: { select: { label: true, color: true } },
                },
            })
        ),
        withPrisma((prisma) =>
            prisma.galleryEvent.findMany({
                where: { startAt: { lte: weekEnd }, endAt: { gte: weekStart } },
                orderBy: { startAt: "asc" },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    startAt: true,
                    endAt: true,
                    workplaceId: true,
                    workplace: { select: { label: true, color: true } },
                },
            })
        ),
    ]);

    return (
        <main className="p-4">
            <ScheduleWeek
                key={weekStart.toISOString()}
                language={language}
                weekDays={weekDays}
                weekStartIso={weekStart.toISOString()}
                weekEndIso={weekEnd.toISOString()}
                myShifts={myShifts}
                isSuperuser={isSuperuser}
                employees={employees}
                workplaces={workplaces}
                positions={positions}
                teamAvailabilities={teamAvailabilities}
                dailyMeetings={dailyMeetings}
                events={events}
            />
        </main>
    )
}