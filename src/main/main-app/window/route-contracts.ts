const SAFE_SPACE_ID = /^[A-Za-z0-9][A-Za-z0-9._~-]{0,199}$/u;
const LOCAL_ROUTE = "/local";

export const DEBUG_ROUTE = "/debug";
export const GLOBAL_DICTATION_ROUTE = "/global-dictation";
export const QUICK_CHAT_PREWARM_ROUTE = "/chatgpt/quick-chat-prewarm";

export function buildQuickChatRoute(conversationId: string, context: { threadId: string; hostId: string } | null = null): string {
  const route = `/chatgpt/quick-chat/${encodeURIComponent(conversationId)}`;
  return context == null ? route : `${route}?${new URLSearchParams({ contextSourceConversationId: context.threadId, contextSourceHostId: context.hostId })}`;
}

export function buildSharedConversationRoute(conversationId: string): string {
  return `/share/${encodeURIComponent(conversationId)}`;
}

export function buildConversationRoute(conversationId: string): string {
  return `${LOCAL_ROUTE}/${conversationId}`;
}

function pluginSuffix(target: any): string {
  if (target?.target == null) return "";
  const path = (target.target.path ?? []).map((entry: string) => encodeURIComponent(entry)).join("/");
  const query = new URLSearchParams(target.target.query ?? []).toString();
  return `${path ? `/${path}` : ""}${query ? `?${query}` : ""}`;
}

export function buildPluginDetailRoute(target: { pluginId: string; target?: unknown }): string {
  return `/plugins/${encodeURIComponent(target.pluginId)}${pluginSuffix(target)}`;
}

export function buildMcpAppRoute(pluginId: string, toolName: string): string {
  return `/mcp-app/plugins/${encodeURIComponent(pluginId)}/${encodeURIComponent(toolName)}`;
}

function under(route: string | null | undefined, base: string): boolean {
  return Boolean(route && (route === base || route.startsWith(`${base}/`)));
}

export function isSafeAppRoute(route: string | null | undefined): boolean {
  const spaceId = /^\/space\/([^/?#]+)(?:[?#].*)?$/u.exec(route ?? "")?.[1];
  return route === "/" || (spaceId != null && !spaceId.startsWith("local-page-") && SAFE_SPACE_ID.test(spaceId)) ||
    under(route, LOCAL_ROUTE) || under(route, "/plugins") || under(route, "/skills/plugins") || under(route, "/skills/manage") || under(route, "/remote");
}
