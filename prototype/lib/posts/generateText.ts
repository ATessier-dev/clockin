/** Thrown by generateSocialPostText while no LLM provider is wired in yet. */
export class NotConfiguredError extends Error {}

/**
 * Generates a copy-paste-ready social media post, grounded in the item's
 * reference documents and steered away from repeating an already-saved
 * generation. Not wired to a provider yet (account/model choice pending),
 * so it always throws NotConfiguredError; the call site (see
 * app/api/posts/items/[id]/generate/route.ts) already expects that and
 * surfaces it as a clear "not configured" state rather than fabricating
 * a text an employee could mistakenly post.
 */
export async function generateSocialPostText(input: {
  itemTitle: string;
  referenceDocuments: { filename: string; content: string }[];
  previousGenerations: string[];
}): Promise<string> {
  void input;
  throw new NotConfiguredError();
}
