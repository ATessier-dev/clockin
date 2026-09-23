import { getSession } from '@/lib/auth/session';
import { withPrisma } from '@/lib/withPrisma';
import { redirect } from '@/i18n/navigation';
import { type Language } from '@/translations';
import { WorkplacesManager } from './workplacesManager';
import { PositionsManager } from './positionsManager';

export default async function SettingsPage({ params }: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const language = (locale === "en" ? "en" : "fr") as Language;

    const sessionUser = await getSession();
    if (!sessionUser) return null;
    if (sessionUser.role !== "SUPERUSER") {
        redirect({ href: "/dashboard", locale });
    }

    const [workplaces, positions] = await Promise.all([
        withPrisma((prisma) =>
            prisma.workplace.findMany({
                orderBy: { label: "asc" },
                select: { id: true, label: true, description: true, color: true },
            })
        ),
        withPrisma((prisma) =>
            prisma.position.findMany({
                orderBy: { sortOrder: "asc" },
                select: { id: true, name: true, color: true },
            })
        ),
    ]);

    return (
        <main className="flex flex-col items-center gap-6 p-4">
            <WorkplacesManager language={language} workplaces={workplaces} />
            <PositionsManager language={language} positions={positions} />
        </main>
    );
}
