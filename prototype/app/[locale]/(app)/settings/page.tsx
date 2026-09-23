import { getSession } from '@/lib/auth/session';
import { withPrisma } from '@/lib/withPrisma';
import { redirect } from '@/i18n/navigation';
import { type Language } from '@/translations';
import { WorkplacesManager } from './workplacesManager';

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

    const workplaces = await withPrisma((prisma) =>
        prisma.workplace.findMany({
            orderBy: { label: "asc" },
            select: { id: true, key: true, label: true, allowedCidr: true, color: true },
        })
    );

    return (
        <main className="flex flex-col items-center gap-6 p-4">
            <WorkplacesManager language={language} workplaces={workplaces} />
        </main>
    );
}
