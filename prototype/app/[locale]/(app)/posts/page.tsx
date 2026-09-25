import { getSession } from "@/lib/auth/session";
import { withPrisma } from "@/lib/withPrisma";
import { type Language } from "@/translations";
import { PostsView } from "./postsView";

/**
 * Server component: loads post topics/categories and hands them to the
 * client `PostsView`. Open to any employee (unlike topic/category
 * management, generation itself isn't superuser-only).
 */
export default async function PostsPage({ params }: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const language = (locale === "en" ? "en" : "fr") as Language;

    const sessionUser = await getSession();
    if (!sessionUser) return null;

    const [items, categories] = await Promise.all([
        withPrisma((prisma) =>
            prisma.postItem.findMany({
                orderBy: { sortOrder: "asc" },
                select: {
                    id: true,
                    title: true,
                    categoryId: true,
                    documents: { select: { id: true, filename: true, createdAt: true } },
                },
            })
        ),
        withPrisma((prisma) => prisma.postCategory.findMany({ orderBy: { sortOrder: "asc" } })),
    ]);

    return (
        <main className="p-4">
            <PostsView
                language={language}
                isSuperuser={sessionUser.role === "SUPERUSER"}
                categories={categories.map((category) => ({ id: category.id, name: category.name }))}
                items={items.map((item) => ({
                    id: item.id,
                    title: item.title,
                    categoryId: item.categoryId,
                    documents: item.documents.map((document) => ({
                        id: document.id,
                        filename: document.filename,
                        createdAt: document.createdAt.toISOString(),
                    })),
                }))}
            />
        </main>
    );
}
