import { startOfWeek, endOfWeek, endOfDay } from 'date-fns';
import { getTranslation, dashboardPageTranslations, type Language } from "@/translations";
import { getSession } from '@/lib/auth/session';
import { withPrisma } from '@/lib/withPrisma';
import { PageHeading } from "@/components/ui/pageHeading";
import { getLatestClockEvent } from '@/lib/clock/recordClockEvent';
import { ClockButton } from './clockButton';
import { ClockLog } from './clockLog';
import { UpcomingShiftCard } from './upcomingShift';
import { MyExpectedStatusCard } from './myExpectedStatus';

export default async function DasboardPage({params, searchParams} : {
  params: Promise<{locale : string}>;
  searchParams: Promise<{ week?: string }>;
}) {

  const { locale } = await params;
  const { week } = await searchParams;
  const sessionUser = await getSession();
  if (!sessionUser) return null;
  const language = (locale === "en" ? "en" : "fr") as Language;

  const latestClockEvent = await getLatestClockEvent(sessionUser.employeeId);
  const isClockedIn = latestClockEvent?.type === "CLOCK_IN";

  const shiftNow = await withPrisma((prisma) =>
    prisma.shift.findFirst({
      where: {
        employeeId: sessionUser.employeeId,
        startAt: { lte: new Date() },
        endAt: { gte: new Date() },
      },
      select: { workplace: { select: { label: true, color: true } } },
    })
  );

  const upcomingShift = await withPrisma((prisma) =>
    prisma.shift.findFirst({
      where: {
        employeeId: sessionUser.employeeId,
        startAt: { gt: endOfDay(new Date()) },
      },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        workplace: { select: { label: true, color: true } },
      },
    })
  );

  const requestedDate = week ? new Date(week) : new Date();
  const referenceDate = Number.isNaN(requestedDate.getTime()) ? new Date() : requestedDate;
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekClockEvents = await withPrisma((prisma) =>
    prisma.clockEvent.findMany({
      where: {
        employeeId: sessionUser.employeeId,
        at: { gte: weekStart, lte: weekEnd },
      },
      orderBy: { at: "asc" },
      select: {
        id: true,
        type: true,
        at: true,
        workplace: { select: { label: true, color: true } },
      },
    })
  );

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <PageHeading title={getTranslation(dashboardPageTranslations.title, language)} />

      <MyExpectedStatusCard language={language} isClockedIn={isClockedIn} shiftNow={shiftNow} />

      <div className="grid gap-4 sm:grid-cols-2">
        <ClockButton
          language={language}
          isClockedIn={isClockedIn}
          since={isClockedIn ? latestClockEvent.at : null}
        />
        <UpcomingShiftCard language={language} shift={upcomingShift} />
      </div>

      <ClockLog language={language} entries={weekClockEvents} weekStartIso={weekStart.toISOString()} />
    </main>
  )

}
