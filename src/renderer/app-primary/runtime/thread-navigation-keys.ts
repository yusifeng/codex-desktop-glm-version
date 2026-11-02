export type SearchThread =
  | { kind: "local"; hostId: string; threadKey: string }
  | { kind: "remote"; threadKey: string }
  | { kind: "chatgpt"; conversationId: string };

/** Build the release-stable key used to deduplicate search results. */
export function getThreadSearchKey(thread: SearchThread): string {
  switch (thread.kind) {
    case "local":
      return thread.hostId === "local" ? thread.threadKey : `${thread.threadKey}:${thread.hostId}`;
    case "remote":
      return thread.threadKey;
    case "chatgpt":
      return `chatgpt:${thread.conversationId}`;
  }
}

/** Serialize the account/navigation tuple used by the route cache. */
export function createNavigationCacheKey({
  accountId,
  locale,
  navigationKey,
  pathname,
  product,
}: {
  accountId: unknown;
  locale: unknown;
  navigationKey: unknown;
  pathname: unknown;
  product: unknown;
}): string {
  return JSON.stringify([accountId, locale, product, pathname, navigationKey]);
}
