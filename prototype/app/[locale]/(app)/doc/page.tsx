import { getSession } from '@/lib/auth/session';
import { withPrisma } from '@/lib/withPrisma';
import type { Language } from '@/translations';

export default async function SchedulePage({params} : {
    params: Promise<{locale: string}>
}) {
    const { locale } = await params;
    const sessionUser = await getSession();
    if (!sessionUser) return null;
    const language = (locale === "en" ? "en" : "fr") as Language;
    const employee = await withPrisma((prisma) =>
    prisma.employee.findUniqueOrThrow({
        where: { id: sessionUser.employeeId },
        select: { id: true, firstName: true, lastName: true, role: true, locale: true },
    })
    );

    return (
        <main>

        </main>
    )
}