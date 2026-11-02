const HOTKEY_THREAD_ROUTE = "/hotkey-window/thread";
const HOTKEY_REMOTE_ROUTE = "/hotkey-window/remote";
const LOCAL_CONVERSATION_ROUTE = "/local";
const MCP_APP_ROUTE = "/mcp-app";
const MCP_PLUGIN_ROUTE = "/mcp-app/plugins";
const PLUGIN_ROUTE = "/plugins";
const PLUGIN_SETTINGS_ROUTE = "/settings/plugins";
const MANAGED_PLUGIN_ROUTE = "/skills/manage/plugins";
const REMOTE_CONVERSATION_ROUTE = "/remote";
const PLUGIN_ID_PATTERN = /^(?:plugins_[0-9a-f]{32}|(?:plugins~)?Plugin_[0-9a-f]{32}|plugin_[A-Za-z0-9][A-Za-z0-9_-]{0,247})$/u;
const LEGACY_PLUGIN_ID_PATTERN = /^(?:plugins~)?Plugin_[0-9a-f]{32}$/u;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

export interface PluginRouteInput {
  pluginId: string;
  deepLinkMode?: string | null;
  hostId?: string | null;
  marketplacePath?: string | null;
  pluginName?: string | null;
  remoteMarketplaceName?: string | null;
}

/** Build a hotkey-window route for a local thread. */
export function createHotkeyThreadRoute(conversationId: string): string {
  return `${HOTKEY_THREAD_ROUTE}/${conversationId}`;
}

/** Build the ordinary local-conversation route. */
export function createLocalConversationRoute(conversationId: string): string {
  return `${LOCAL_CONVERSATION_ROUTE}/${conversationId}`;
}

export function createHotkeyRemoteRoute(taskId: string): string {
  return `${HOTKEY_REMOTE_ROUTE}/${taskId}`;
}

export function createComputerAssistantRoute(conversationId: string): string {
  return `/ca/${conversationId}`;
}

export function createRemoteConversationRoute(taskId: string): string {
  return `${REMOTE_CONVERSATION_ROUTE}/${taskId}`;
}

/** Build an MCP app route with encoded server and tool identifiers. */
export function createMcpAppRoute(server: string, toolName: string): string {
  return `${MCP_APP_ROUTE}/${encodeURIComponent(server)}/${encodeURIComponent(toolName)}`;
}

/** Build the plugin-settings MCP route with encoded identifiers. */
export function createPluginSettingsRoute(server: string, toolName: string): string {
  return `${PLUGIN_SETTINGS_ROUTE}/${encodeURIComponent(server)}/${encodeURIComponent(toolName)}`;
}

export function createPluginRoute(input: PluginRouteInput): string {
  return `${PLUGIN_ROUTE}/${encodePluginId(input.pluginId)}${serializePluginRouteQuery(input)}`;
}

export function createManagedPluginRoute(input: PluginRouteInput): string {
  return `${MANAGED_PLUGIN_ROUTE}/${encodePluginId(input.pluginId)}${serializePluginRouteQuery(input)}`;
}

export function createMcpPluginRoute(server: string, toolName: string): string {
  return `${MCP_PLUGIN_ROUTE}/${encodeURIComponent(server)}/${encodeURIComponent(toolName)}`;
}

export function parseSkillsRoute(value: string | URL): string | null {
  let url: URL;
  try {
    url = typeof value === "string" ? new URL(value) : value;
  } catch {
    return null;
  }
  if ((url.protocol !== "codex:" && url.protocol !== "codex-dev:") ||
      url.hostname !== "skills" || url.username !== "" || url.password !== "" || url.port !== "") return null;
  return `/skills${url.pathname === "" || url.pathname === "/" ? "" : url.pathname}${url.search}${url.hash}`;
}

export function parseConversationRoute(
  value: string | URL,
  { allowExtraPathSegments = false }: { allowExtraPathSegments?: boolean } = {},
): { conversationId: string; openReview?: true; reviewDiffFilter?: "branch" | "last-turn"; reviewPath?: string } | null {
  let url: URL;
  try {
    url = typeof value === "string" ? new URL(value) : value;
  } catch {
    return null;
  }
  const [conversationId, ...extraPathSegments] = url.pathname.split("/").filter(Boolean);
  const rawDiffFilter = url.searchParams.get("diffFilter");
  const diffFilter = rawDiffFilter === "branch" || rawDiffFilter === "last-turn" ? rawDiffFilter : null;
  const rawReviewPath = url.searchParams.get("path");
  const reviewPath = rawReviewPath != null && rawReviewPath.length > 0 ? rawReviewPath : null;
  const view = url.searchParams.get("view") === "review" ? "review" : null;
  if (url.protocol !== "codex:" || url.host !== "threads" || conversationId == null ||
      !UUID_PATTERN.test(conversationId) || (!allowExtraPathSegments && extraPathSegments.length > 0)) return null;
  if (view !== "review") return { conversationId };
  if (diffFilter == null) return { conversationId, openReview: true };
  return {
    conversationId,
    openReview: true,
    reviewDiffFilter: diffFilter,
    ...(reviewPath == null ? {} : { reviewPath }),
  };
}

export function isPluginId(value: string): boolean {
  return PLUGIN_ID_PATTERN.test(value);
}

export function areEquivalentPluginIds(left: string, right: string): boolean {
  return left === right ||
    (LEGACY_PLUGIN_ID_PATTERN.test(left) && LEGACY_PLUGIN_ID_PATTERN.test(right) &&
      stripLegacyPluginPrefix(left) === stripLegacyPluginPrefix(right));
}

function stripLegacyPluginPrefix(value: string): string {
  return value.startsWith("plugins~") ? value.slice(8) : value;
}

function encodePluginId(value: string): string {
  return encodeURIComponent(value).replaceAll("%40", "@");
}

function serializePluginRouteQuery(input: PluginRouteInput): string {
  const query = new URLSearchParams();
  if (input.marketplacePath != null) query.set("marketplacePath", input.marketplacePath);
  if (input.remoteMarketplaceName != null) query.set("remoteMarketplaceName", input.remoteMarketplaceName);
  if (input.pluginName != null) query.set("pluginName", input.pluginName);
  if (input.deepLinkMode != null) query.set("mode", input.deepLinkMode);
  if (input.hostId != null) query.set("hostId", input.hostId);
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}
