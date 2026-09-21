import { getSession } from '@/lib/auth/session';
import { withPrisma } from '@/lib/withPrisma';
import { type Language } from '@/translations';
import { SettingsView } from './settingsView';
import { WorkplacesManager } from './workplacesManager';

export default async function SettingsPage({ params }: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const language = (locale === "en" ? "en" : "fr") as Language;

    const sessionUser = await getSession();
    if (!sessionUser) return null;
    const isSuperuser = sessionUser.role === "SUPERUSER";

    const employee = await withPrisma((prisma) =>
        prisma.employee.findUniqueOrThrow({
            where: { id: sessionUser.employeeId },
            select: {
                id: true,
                code: true,
                firstName: true,
                lastName: true,
                phone: true,
                preferredWorkplaceId: true,
                availabilityNote: true,
                locale: true,
            },
        })
    );

    const workplaces = await withPrisma((prisma) =>
        prisma.workplace.findMany({ orderBy: { label: "asc" }, select: { id: true, label: true } })
    );

    const allWorkplaces = isSuperuser
        ? await withPrisma((prisma) =>
              prisma.workplace.findMany({
                  orderBy: { label: "asc" },
                  select: { id: true, key: true, label: true, allowedCidr: true, color: true },
              })
          )
        : [];

    return (
        <main className="flex flex-col items-center gap-6 p-4">
            <SettingsView
                language={language}
                employee={{ ...employee, locale: employee.locale === "en" ? "en" : "fr" }}
                workplaces={workplaces}
            />
            {isSuperuser && <WorkplacesManager language={language} workplaces={allWorkplaces} />}
        </main>
    );
}
