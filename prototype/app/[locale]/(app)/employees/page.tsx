import { getSession } from '@/lib/auth/session';
import { withPrisma } from '@/lib/withPrisma';
import { redirect } from '@/i18n/navigation';
import { type Language } from '@/translations';
import { EmployeesView } from './employeesView';

export default async function EmployeesPage({ params }: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const language = (locale === "en" ? "en" : "fr") as Language;

    const sessionUser = await getSession();
    if (!sessionUser) return null;
    if (sessionUser.role !== "SUPERUSER") {
        redirect({ href: "/dashboard", locale });
    }

    const employees = await withPrisma((prisma) =>
        prisma.employee.findMany({
            orderBy: [{ active: "desc" }, { firstName: "asc" }],
            select: {
                id: true,
                code: true,
                firstName: true,
                lastName: true,
                role: true,
                phone: true,
                preferredWorkplaceId: true,
                availabilityNote: true,
                active: true,
            },
        })
    );

    const workplaces = await withPrisma((prisma) =>
        prisma.workplace.findMany({ orderBy: { label: "asc" }, select: { id: true, label: true } })
    );

    return (
        <main className="p-4">
            <EmployeesView language={language} employees={employees} workplaces={workplaces} />
        </main>
    );
}
