/**
 * Normalize the API's suggested_followups payload for the conversation shelf.
 *
 * The primary hub used to expose this as an anonymous helper.  Keeping the
 * parser here makes the payload boundary explicit without importing the
 * primary aggregation runtime (or its UI registration side effects).
 */
export interface SuggestedFollowup {
  prompt: string;
  sourceIndex: number;
  title: string;
}

export function normalizeSuggestedFollowups(value: unknown): SuggestedFollowup[] {
  if (typeof value !== "object" || value == null || !Array.isArray((value as { suggested_followups?: unknown }).suggested_followups)) return [];
  const suggestions = (value as { suggested_followups: unknown[] }).suggested_followups;
  const result: SuggestedFollowup[] = [];
  for (const [sourceIndex, item] of suggestions.entries()) {
    if (typeof item !== "object" || item == null) continue;
    const promptValue = (item as { prompt?: unknown }).prompt;
    const prompt = typeof promptValue === "string" ? promptValue.trim() : "";
    if (!prompt) continue;
    const titleValue = (item as { title?: unknown }).title;
    const title = typeof titleValue === "string" ? titleValue.trim() : "";
    result.push({ prompt, sourceIndex, title: title || prompt });
    if (result.length === 3) break;
  }
  return result;
}
