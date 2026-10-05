export interface ConversationRoute {
  conversationId: string;
  path: string;
}

/** Parse a location into a conversation route through injected URL/router policies. */
export function parseConversationRoute(input: string | null | undefined, deps: {
  parseUrl: (value: string) => { pathname?: string | null; search?: string };
  matchRoute: (value: { pathname: string; routeTemplate: string; search?: string }) => string | null;
}): ConversationRoute | null {
  if (input == null) return null;
  const { pathname, search } = deps.parseUrl(input);
  if (pathname == null) return null;
  const conversationId = deps.matchRoute({ pathname, routeTemplate: pathname, search });
  return conversationId == null ? null : { conversationId, path: input };
}
