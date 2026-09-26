import { getSession } from "@/lib/auth/session";
import { withPrisma } from "@/lib/withPrisma";
import { type Language } from "@/translations";
import { PostsView } from "./postsView";

/**
 * Server component: loads post media and topics (two independent lists)
 * and hands them to the client `PostsView`. Open to any employee (unlike
 * media/topic management, generation itself isn't superuser-only).
 */
export default async function PostsPage({ params }: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const language = (locale === "en" ? "en" : "fr") as Language;

    const sessionUser = await getSession();
    if (!sessionUser) return null;

    const [media, topics] = await Promise.all([
        withPrisma((prisma) => prisma.postMedia.findMany({ orderBy: { sortOrder: "asc" } })),
        withPrisma((prisma) =>
            prisma.postTopic.findMany({
                orderBy: { sortOrder: "asc" },
                select: {
                    id: true,
                    title: true,
                    arturSlug: true,
                    documents: { select: { id: true, filename: true, createdAt: true } },
                },
            })
        ),
    ]);

    return (
        <main className="p-4">
            <PostsView
                language={language}
                isSuperuser={sessionUser.role === "SUPERUSER"}
                media={media.map((medium) => ({ id: medium.id, name: medium.name }))}
                topics={topics.map((topic) => ({
                    id: topic.id,
                    title: topic.title,
                    arturSlug: topic.arturSlug,
                    documents: topic.documents.map((document) => ({
                        id: document.id,
                        filename: document.filename,
                        createdAt: document.createdAt.toISOString(),
                    })),
                }))}
            />
        </main>
    );
}
