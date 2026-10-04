/** Drop null placeholders from a turn's item list (original app-initial jFn/w$t). */
export function flattenConversationItems<T>(items: readonly (T | null | undefined)[]): T[] {
  return items.filter((item): item is T => item != null);
}
