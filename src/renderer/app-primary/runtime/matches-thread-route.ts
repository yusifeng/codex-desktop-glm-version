export interface ThreadRouteRef { hostId?: string | null; conversationId?: string | null }
export interface ThreadRoute { routeKind?: string; hostId?: string | null; conversationId?: string | null }

/** Match a conversation reference against chatgpt/local route identity rules. */
export function matchesThreadRoute(ref: ThreadRouteRef | null | undefined, route: ThreadRoute, fallbackConversationId?: string): boolean {
  if (ref == null) return false;
  if (route.routeKind !== "chatgpt-thread" && route.routeKind !== "local-thread") return false;
  if (route.routeKind === "chatgpt-thread") return ref.hostId == null && route.conversationId === (fallbackConversationId ?? ref.conversationId);
  return route.hostId === ref.hostId && route.conversationId === ref.conversationId;
}
