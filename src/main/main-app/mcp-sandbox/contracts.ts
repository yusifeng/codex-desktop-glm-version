export const MCP_SANDBOX_PARTITION = "persist:codex-mcp-app-sandbox:shared";
const SANDBOX_HOST = "web-sandbox.oaiusercontent.com";
const SANDBOX_ID = /^[A-Za-z0-9_-]{1,128}$/;

const REQUIRED_PORT_NAMES = [
  "navigate", "notifyMcpAppsHostContext", "notifyMcpAppsToolCancelled", "notifyMcpAppsToolInput",
  "notifyMcpAppsToolResult", "requestMcpAppsResourceTeardown", "runWidgetCode", "setAdditionalGlobals",
  "setSafeArea", "setTheme", "setWidgetData", "setWidgetView",
];
const OPTIONAL_PORT_NAMES = ["notifyMcpAppsMcpNotification", "prepareEnvironment", "runUserCode", "screenshot", "stop"];

export function isMcpSandboxId(value: unknown): value is string {
  return typeof value === "string" && SANDBOX_ID.test(value);
}

export function isMcpSandboxPortNameList(value: unknown): value is string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) return false;
  const names = new Set(value);
  return names.size === value.length && REQUIRED_PORT_NAMES.every((entry) => names.has(entry)) && value.every((entry) => REQUIRED_PORT_NAMES.includes(entry) || OPTIONAL_PORT_NAMES.includes(entry));
}

export function isMcpSandboxHostname(hostname: string): boolean {
  return hostname === SANDBOX_HOST || hostname.endsWith(`.${SANDBOX_HOST}`);
}

export function mcpSandboxPartition(sandboxId: string, options: { persist?: boolean } = {}): string {
  return `${options.persist ? "persist:" : ""}codex-mcp-app-sandbox:${sandboxId}`;
}

export function parseMcpSandboxPartition(partition: unknown): string | null {
  if (typeof partition !== "string") return null;
  const value = partition.replace(/^persist:/, "");
  if (!value.startsWith("codex-mcp-app-sandbox:")) return null;
  const id = value.slice("codex-mcp-app-sandbox:".length);
  return id.length > 0 ? id : null;
}

function parseUrl(value: unknown): URL | null {
  if (typeof value !== "string") return null;
  try { return new URL(value); } catch { return null; }
}

function trustedSandboxUrl(value: unknown): URL | null {
  const url = parseUrl(value);
  return url != null && (url.protocol === "https:" || url.protocol === "codex-sandbox:") && !url.port && !url.username && !url.password && isMcpSandboxHostname(url.hostname) ? url : null;
}

export function parseMcpSandboxOrigin(value: string, options: { requireSkybridge?: boolean } = {}): string | null {
  const url = trustedSandboxUrl(value);
  return url == null || (options.requireSkybridge && (url.pathname !== "/" || url.searchParams.get("app") !== "skybridge")) ? null : `${url.protocol}//${url.host}`;
}

export function parsePersistentMcpSandboxId(value: string): string | null {
  const url = parseUrl(value);
  const id = url?.hash ? new URLSearchParams(url.hash.slice(1)).get("sandboxId") : null;
  return isMcpSandboxId(id) ? id : null;
}

export function parseMcpSandboxInitId(value: string): string | null {
  const url = parseUrl(value);
  const id = url?.hash ? new URLSearchParams(url.hash.slice(1)).get("initId") : null;
  return isMcpSandboxId(id) ? id : null;
}

export function buildMcpSandboxUrl({ locale, scheme = "https", subdomain }: { locale: string; scheme?: string; subdomain: string }): string {
  const url = new URL(`${scheme}://${SANDBOX_HOST}`);
  url.hostname = `${subdomain}.${url.hostname}`;
  url.pathname = "/";
  url.searchParams.set("app", "skybridge");
  url.searchParams.set("locale", locale);
  url.searchParams.set("deviceType", "desktop");
  url.searchParams.set("unsafeSkipTargetOriginCheck", "true");
  url.searchParams.set("backgroundMode", "transparent");
  return url.toString();
}
