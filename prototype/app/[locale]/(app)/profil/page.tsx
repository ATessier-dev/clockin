import { getSession } from '@/lib/auth/session';
import { withPrisma } from '@/lib/withPrisma';
import { type Language } from '@/translations';
import { ProfileView } from './profileView';
import { AvailabilityEditor } from './availabilityEditor';

export default async function ProfilPage({ params }: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const language = (locale === "en" ? "en" : "fr") as Language;

    const sessionUser = await getSession();
    if (!sessionUser) return null;

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
        prisma.workplace.findMany({ orderBy: { label: "asc" }, select: { id: true, label: true, color: true } })
    );

    const availabilities = await withPrisma((prisma) =>
        prisma.employeeAvailability.findMany({
            where: { employeeId: sessionUser.employeeId },
            select: { dayOfWeek: true, workplaceId: true },
        })
    );

    return (
        <main className="flex flex-col items-center gap-6 p-4">
            <ProfileView
                language={language}
                employee={{ ...employee, locale: employee.locale === "en" ? "en" : "fr" }}
                workplaces={workplaces}
            />
            <AvailabilityEditor
                language={language}
                employeeId={sessionUser.employeeId}
                workplaces={workplaces}
                initialAvailabilities={availabilities}
            />
        </main>
    );
}
