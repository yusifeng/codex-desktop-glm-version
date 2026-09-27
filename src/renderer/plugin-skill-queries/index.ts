import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/canonical-plugin-query";

const CONNECTOR_ALIASES = new Map<string, string>();
function canonicalConnectorId(connector: Record<string, unknown>): string | null {
  const id = typeof connector.connector_id === "string" ? connector.connector_id : null;
  if (id == null) return null;
  const status = connector.auth_status;
  const active = connector.activation_status;
  if (status !== "admin_connected" && active !== "activated" && active !== "partially_activated") return null;
  return CONNECTOR_ALIASES.get(id) ?? id;
}
function pluginSkillQuery(pluginId: string, skillName: string) {
  return { queryKey: ["plugins", "skill", pluginId, skillName], enabled: pluginId.length > 0 && skillName.length > 0, retry: false };
}
function pluginQuery(pluginId: string) { return { queryKey: ["plugins", pluginId], enabled: pluginId.length > 0, retry: false }; }
function initializePluginSkillQueries(): void {}
export { pluginSkillQuery as a, initializePluginSkillQueries as i, canonicalConnectorId as n, pluginQuery as r, pluginSkillQuery as t };
