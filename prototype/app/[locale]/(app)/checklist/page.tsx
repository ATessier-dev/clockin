import { getSession } from '@/lib/auth/session';
import { withPrisma } from '@/lib/withPrisma';
import { type Language } from '@/translations';
import { isEffectivelyCompleted } from '@/lib/checklist/effectiveCompletion';
import { ChecklistView } from './checklistView';

export default async function ChecklistPage({ params }: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const language = (locale === "en" ? "en" : "fr") as Language;

    const sessionUser = await getSession();
    if (!sessionUser) return null;

    const [items, categories] = await Promise.all([
        withPrisma((prisma) =>
            prisma.checklistItem.findMany({
                orderBy: { sortOrder: "asc" },
                select: {
                    id: true,
                    label: true,
                    recurrence: true,
                    completed: true,
                    completedAt: true,
                    categoryId: true,
                    completedByEmployee: { select: { id: true, firstName: true, lastName: true } },
                },
            })
        ),
        withPrisma((prisma) => prisma.checklistCategory.findMany({ orderBy: { sortOrder: "asc" } })),
    ]);

    return (
        <main className="p-4">
            <ChecklistView
                language={language}
                isSuperuser={sessionUser.role === "SUPERUSER"}
                currentEmployeeId={sessionUser.employeeId}
                categories={categories.map((category) => ({ id: category.id, name: category.name }))}
                items={items.map((item) => {
                    const completed = isEffectivelyCompleted(item.recurrence, item.completed, item.completedAt);
                    return {
                        id: item.id,
                        label: item.label,
                        recurrence: item.recurrence,
                        completed,
                        categoryId: item.categoryId,
                        completedByEmployee: completed ? item.completedByEmployee : null,
                    };
                })}
            />
        </main>
    );
}
