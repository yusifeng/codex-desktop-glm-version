const HOTKEY_THREAD_ROUTE = "/hotkey-window/thread";
const LOCAL_CONVERSATION_ROUTE = "/local";
const MCP_APP_ROUTE = "/mcp-app";
const PLUGIN_SETTINGS_ROUTE = "/settings/plugins";

/** Build a hotkey-window route for a local thread. */
export function createHotkeyThreadRoute(conversationId: string): string {
  return `${HOTKEY_THREAD_ROUTE}/${conversationId}`;
}

/** Build the ordinary local-conversation route. */
export function createLocalConversationRoute(conversationId: string): string {
  return `${LOCAL_CONVERSATION_ROUTE}/${conversationId}`;
}

/** Build an MCP app route with encoded server and tool identifiers. */
export function createMcpAppRoute(server: string, toolName: string): string {
  return `${MCP_APP_ROUTE}/${encodeURIComponent(server)}/${encodeURIComponent(toolName)}`;
}

/** Build the plugin-settings MCP route with encoded identifiers. */
export function createPluginSettingsRoute(server: string, toolName: string): string {
  return `${PLUGIN_SETTINGS_ROUTE}/${encodeURIComponent(server)}/${encodeURIComponent(toolName)}`;
}
