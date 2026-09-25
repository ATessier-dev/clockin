// Reads artur.art's public blog API (no auth needed on GET, see
// react/artur/app/api/blog/route.ts in the artur repo) to import its blog
// posts as post topics, with the article content flattened into a .txt
// reference document for the LLM. Only the "fr" locale is fetched, matching
// this app's default language.

const ARTUR_BASE_URL = "https://www.artur.art";
const FETCH_TIMEOUT_MS = 10_000;

export type ArturBlogListItem = {
  id: number;
  slug: string;
  category: string;
  title: string;
  teaser: string;
};

type Bullet = { label?: string; text?: string };
type ArturBlogDetail = {
  title: string;
  teaser: string;
  intro?: { title: string; subtitle: string; content: string } | null;
  guide?: { title: string; content: string; bullets?: Bullet[] } | null;
  cards?: { cards?: { title: string; content: string; bullets?: Bullet[] }[] } | null;
  testimonial?: { title: string; content: string; author: string } | null;
  related?: { title: string; content: string } | null;
  com_guide?: { title: string; subtitle: string; content: string; bullets?: Bullet[] } | null;
  discovery?: { title: string; content: string } | null;
  testimonial_section?: { title: string; items?: { content: string; author: string }[] } | null;
  faqs?: { question: string; answer: string }[];
};

async function fetchJson(path: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${ARTUR_BASE_URL}${path}`, { signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

/** Lists artur.art's French blog posts (teaser only, no full content). */
export async function fetchArturBlogList(): Promise<ArturBlogListItem[]> {
  const data = (await fetchJson("/api/blog?locale=fr")) as { posts?: ArturBlogListItem[] } | null;
  if (!data) throw new Error("artur_unreachable");
  return data.posts ?? [];
}

async function fetchArturBlogDetail(slug: string): Promise<ArturBlogDetail | null> {
  const data = (await fetchJson(`/api/blog/${encodeURIComponent(slug)}?locale=fr`)) as { post?: ArturBlogDetail } | null;
  return data?.post ?? null;
}

function bulletsToText(bullets: Bullet[] | undefined): string[] {
  return (bullets ?? []).map((bullet) => [bullet.label, bullet.text].filter(Boolean).join(": "));
}

/** Flattens an artur blog post's structured content blocks into plain text, for use as an LLM reference document. */
function buildReferenceDocumentContent(post: ArturBlogDetail): string {
  const sections: string[] = [post.title, post.teaser];

  if (post.intro) sections.push(post.intro.title, post.intro.subtitle, post.intro.content);
  if (post.guide) sections.push(post.guide.title, post.guide.content, ...bulletsToText(post.guide.bullets));
  for (const card of post.cards?.cards ?? []) {
    sections.push(card.title, card.content, ...bulletsToText(card.bullets));
  }
  if (post.testimonial) sections.push(post.testimonial.title, post.testimonial.content, `— ${post.testimonial.author}`);
  if (post.related) sections.push(post.related.title, post.related.content);
  if (post.com_guide) {
    sections.push(post.com_guide.title, post.com_guide.subtitle, post.com_guide.content, ...bulletsToText(post.com_guide.bullets));
  }
  if (post.discovery) sections.push(post.discovery.title, post.discovery.content);
  if (post.testimonial_section) {
    sections.push(post.testimonial_section.title);
    for (const item of post.testimonial_section.items ?? []) sections.push(`${item.content} — ${item.author}`);
  }
  for (const faq of post.faqs ?? []) sections.push(faq.question, faq.answer);

  return sections.filter(Boolean).join("\n\n");
}

/** Fetches an artur blog post's full content and flattens it into reference-document text. Null if the post is gone. */
export async function fetchArturBlogReferenceContent(slug: string): Promise<string | null> {
  const post = await fetchArturBlogDetail(slug);
  return post ? buildReferenceDocumentContent(post) : null;
}
