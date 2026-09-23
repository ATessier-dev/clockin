import { getSession } from '@/lib/auth/session';
import { withPrisma } from '@/lib/withPrisma';
import { type Language } from '@/translations';
import { DocView } from './docView';

export default async function DocPage({ params }: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const language = (locale === "en" ? "en" : "fr") as Language;

    const sessionUser = await getSession();
    if (!sessionUser) return null;

    const [categories, links] = await Promise.all([
        withPrisma((prisma) => prisma.docCategory.findMany({ orderBy: { sortOrder: "asc" } })),
        withPrisma((prisma) =>
            prisma.docLink.findMany({
                orderBy: { sortOrder: "asc" },
                select: { id: true, title: true, url: true, description: true, categoryId: true },
            })
        ),
    ]);

    return (
        <main className="p-4">
            <DocView
                language={language}
                isSuperuser={sessionUser.role === "SUPERUSER"}
                categories={categories.map((category) => ({ id: category.id, name: category.name }))}
                links={links}
            />
        </main>
    );
}
