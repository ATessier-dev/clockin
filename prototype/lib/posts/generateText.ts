/** Thrown by generateSocialPostText while no LLM provider is wired in yet. */
export class NotConfiguredError extends Error {}

/**
 * Generates a copy-paste-ready social media post for the given medium,
 * grounded in the topic's reference documents and steered away from
 * repeating a generation already saved for this topic on any medium. Not
 * wired to a provider yet (account/model choice pending), so it always
 * throws NotConfiguredError; the call site (see
 * app/api/posts/topics/[id]/generate/route.ts) already expects that and
 * surfaces it as a clear "not configured" state rather than fabricating a
 * text an employee could mistakenly post.
 */
export async function generateSocialPostText(input: {
  topicTitle: string;
  mediaName: string;
  referenceDocuments: { filename: string; content: string }[];
  previousGenerations: string[];
}): Promise<string> {
  void input;
  throw new NotConfiguredError();
}
