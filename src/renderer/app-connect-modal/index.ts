import "@rchunk/rolldown-runtime";
import "@rchunk/country-codes";
import "@rchunk/google-logo";
import "@rchunk/connector-post-connect-dialog";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient, rJt as apiClient } from "@rchunk/app-initial";

interface ConnectorApp { description?: string; id: string; isAccessible?: boolean; name: string; [key: string]: unknown }
interface AppConnectModalProps {
  app: ConnectorApp;
  beforeConnect?(): Promise<void> | void;
  connectApp?(input: Record<string, unknown>): Promise<unknown>;
  connectorAuth?: { authReason: string; linkId?: string };
  hostId?: string;
  isReconnecting?: boolean;
  onConnected?(): void;
  onConnectFailed?(error: unknown): void;
  onConnectStarted?(appId: string): void;
  onExternalConnectStarted?(appId: string): void;
  onOAuthStarted?(event: Record<string, unknown>): void;
  onOpenChange(open: boolean): void;
  open?: boolean;
  reauthLinkId?: string;
}
interface ConnectorApi { safePost<Response>(path: string, options: Record<string, unknown>): Promise<Response> }
const jsx = getJsxRuntime();
const React = getReactRuntime();
const client = apiClient as unknown as ConnectorApi;

function getCompanionConnectorIds({ availableAppIds = [], companionConnectorIds = [], companionConnectors = [], companionLinks = [] }: Record<string, unknown[]>): string[] {
  const values = [...companionConnectorIds, ...companionConnectors, ...companionLinks, ...availableAppIds];
  return [...new Set(values.flatMap(value => typeof value === "string" ? [value] : typeof value === "object" && value != null && "id" in value ? [String((value as { id: unknown }).id)] : []))];
}
function connectorNeedsAdminApproval({ connectorId }: { connectorId: string; disableExposureLog?: boolean; statsigClient?: unknown }): boolean { return connectorId.startsWith("admin:"); }
function resolveAvailableConnectors(input: Record<string, unknown[]> & { connectors?: unknown[] }): string[] { return getCompanionConnectorIds(input).filter(id => input.connectors == null || input.connectors.some(value => typeof value === "object" && value != null && (value as { id?: unknown }).id === id)); }
function getConnectorExposure({ connectorId }: { connectorId: string }): string[] { return connectorId ? [`connector:${connectorId}`] : []; }
function initializeAppConnectHelpers(): void {}
function normalizeConnectorDescription(value: unknown): string { return typeof value === "string" ? value.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") : ""; }
function getAppDescription(app: ConnectorApp): string { return normalizeConnectorDescription(app.description); }
function selectCompanionConnector(connectorId: string, connectorIds: string[]): string | null { return connectorIds.includes(connectorId) ? connectorId : connectorIds[0] ?? null; }
function getDefaultCompanionLinks(connectorId: string): string[] { return connectorId ? [`${connectorId}:default`] : []; }
function resolveCompanionLinks(connectorId: string, links: string[]): string[] { return links.filter(link => link.startsWith(`${connectorId}:`)); }
function initializeAppConnectRuntime(): void { initializeApiClient(); }
function initializeConnectorRuntime(): void {}
function initializeConnectorQueries(): void {}
function initializeAppConnectState(): void {}

function AppConnectModal({ app, beforeConnect, connectApp, connectorAuth, hostId, isReconnecting = false, onConnected, onConnectFailed, onConnectStarted, onExternalConnectStarted, onOAuthStarted, onOpenChange, open = true, reauthLinkId }: AppConnectModalProps): unknown {
  const [status, setStatus] = React.useState<"idle" | "connecting" | "connected" | "error">("idle");
  if (!open) return null;
  const connect = async () => {
    if (status === "connecting") return;
    setStatus("connecting");
    onConnectStarted?.(app.id);
    try {
      await beforeConnect?.();
      const result = connectApp == null ? await client.safePost<Record<string, unknown>>("/connectors/{connector_id}/connect", { parameters: { path: { connector_id: app.id } }, requestBody: { host_id: hostId, link_id: reauthLinkId ?? connectorAuth?.linkId } }) : await connectApp({ appId: app.id, hostId, reauthLinkId: reauthLinkId ?? connectorAuth?.linkId });
      if (typeof result === "object" && result != null && "oauth_url" in result) { onExternalConnectStarted?.(app.id); onOAuthStarted?.({ appId: app.id, oauthUrl: result.oauth_url }); }
      setStatus("connected");
      onConnected?.();
    } catch (error) { setStatus("error"); onConnectFailed?.(error); }
  };
  return jsx.jsxs("dialog", { open: true, children: [jsx.jsx("h2", { children: `${isReconnecting ? "Reconnect" : "Connect"} ${app.name}` }), jsx.jsx("p", { children: getAppDescription(app) }), connectorAuth?.authReason === "reauth_required" ? jsx.jsx("p", { role: "note", children: "Your connection needs to be authorized again." }) : null, status === "error" ? jsx.jsx("p", { role: "alert", children: "Connection failed. Try again." }) : null, status === "connected" ? jsx.jsx("p", { role: "status", children: "Connected" }) : null, jsx.jsxs("footer", { children: [jsx.jsx("button", { type: "button", onClick: () => onOpenChange(false), children: "Cancel" }), jsx.jsx("button", { type: "button", disabled: status === "connecting", onClick: connect, children: isReconnecting ? "Reconnect" : "Connect" })] })] });
}

function initializeAppConnectModal(): void { initializeAppConnectRuntime(); initializeConnectorRuntime(); initializeConnectorQueries(); initializeAppConnectHelpers(); initializeAppConnectState(); }
export { getCompanionConnectorIds as a, connectorNeedsAdminApproval as c, resolveAvailableConnectors as d, getConnectorExposure as f, initializeAppConnectHelpers as h, normalizeConnectorDescription as i, getAppDescription as l, selectCompanionConnector as m, initializeAppConnectModal as n, getDefaultCompanionLinks as o, resolveCompanionLinks as p, initializeAppConnectRuntime as r, initializeConnectorQueries as s, AppConnectModal as t, initializeAppConnectState as u };
