import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, UnauthorizedError } from "@/lib/auth/requireSession";
import { fetchArturBlogList, fetchArturBlogReferenceContent } from "@/lib/posts/arturBlog";

/**
 * Imports artur.art blog posts not already present as topics (matched by
 * `arturSlug`), each with a reference document built from the article's
 * content. Additive only: never touches an already-imported topic, so a
 * manual edit or deletion afterward is never overwritten by a later sync.
 * Open to any employee.
 */
export async function POST() {
  try {
    await requireEmployee();

    let listing;
    try {
      listing = await fetchArturBlogList();
    } catch {
      return NextResponse.json({ error: "artur_unreachable" }, { status: 502 });
    }

    const existing = await withPrisma((prisma) =>
      prisma.postTopic.findMany({
        where: { arturSlug: { in: listing.map((post) => post.slug) } },
        select: { arturSlug: true },
      })
    );
    const existingSlugs = new Set(existing.map((topic) => topic.arturSlug));
    const newPosts = listing.filter((post) => !existingSlugs.has(post.slug));

    const lastTopic = await withPrisma((prisma) => prisma.postTopic.findFirst({ orderBy: { sortOrder: "desc" } }));
    let nextSortOrder = (lastTopic?.sortOrder ?? -1) + 1;

    const imported: { id: string; title: string }[] = [];
    for (const post of newPosts) {
      const content = await fetchArturBlogReferenceContent(post.slug);
      if (!content) continue;

      const topic = await withPrisma((prisma) =>
        prisma.postTopic.create({
          data: {
            title: post.title,
            arturSlug: post.slug,
            sortOrder: nextSortOrder,
            documents: { create: { filename: `${post.slug}.txt`, content } },
          },
        })
      );
      nextSortOrder += 1;
      imported.push({ id: topic.id, title: topic.title });
    }

    return NextResponse.json({ imported, checked: listing.length });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
