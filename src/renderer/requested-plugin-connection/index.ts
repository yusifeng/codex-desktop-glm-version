import "@rchunk/app-shared";
import "@rchunk/app-initial";

export interface RequestedPluginConnectionInput { appConnectOptions?: Record<string, unknown>; requestedConnectorId?: string | null; requiresAppSetup?: boolean; fetchConnector?(connectorId: string): Promise<{ description?: string | null; name: string; status?: string }>; fetchLink?(connectorId: string): Promise<{ auth_status?: string | null } | null> }
export type RequestedPluginConnectionResult = { kind: "ready" | "unavailable" } | { app: { category: null; description: string | null; id: string; installUrl: null; name: string }; kind: "needsAuth" };
async function requestedPluginConnection(input: RequestedPluginConnectionInput): Promise<RequestedPluginConnectionResult> {
  const connectorId = input.requestedConnectorId;
  if (!input.requiresAppSetup || connectorId == null) return { kind: "ready" };
  if (input.fetchConnector == null || input.fetchLink == null) return { kind: "unavailable" };
  try {
    const [connector, link] = await Promise.all([input.fetchConnector(connectorId), input.fetchLink(connectorId)]);
    if (connector.status === "DISABLED_BY_ADMIN") return { kind: "unavailable" };
    if (link == null || (link.auth_status != null && link.auth_status !== "ACTIVE")) return { kind: "needsAuth", app: { category: null, description: connector.description ?? null, id: connectorId, installUrl: null, name: connector.name } };
    return { kind: "ready" };
  } catch { return { kind: "unavailable" }; }
}
const initialize = (): void => {};
export { requestedPluginConnection as n, initialize as t };
