export type ChatSlugInput = string | { directoryName?: string | null; prompt?: string | null } | null | undefined;

/** Derive the stable short slug used for a new chat directory. */
export function createChatSlug(input: ChatSlugInput): string {
  const directoryName = typeof input === "object" && input != null ? input.directoryName : null;
  const prompt = typeof input === "object" && input != null ? input.prompt : input;
  const tokens = (directoryName ?? prompt)?.toLowerCase().match(/[a-z0-9]+/g);
  if (tokens == null || tokens.length === 0) return "new-chat";
  return (directoryName == null ? tokens.slice(0, 6) : tokens).join("-").slice(0, 80);
}
