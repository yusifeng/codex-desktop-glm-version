/** Pure validation and port-selection policy for the MCP App sandbox guest. */

/** 允许的沙箱主域（含子域）。 */
export const SANDBOX_DOMAIN = "web-sandbox.oaiusercontent.com";
export const INIT_ID_PARAM = "initId";
export const INIT_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/** 必须全部提供的 port 名称。 */
export const REQUIRED_PORT_NAMES = [
  "navigate",
  "notifyMcpAppsHostContext",
  "notifyMcpAppsToolCancelled",
  "notifyMcpAppsToolInput",
  "notifyMcpAppsToolResult",
  "requestMcpAppsResourceTeardown",
  "runWidgetCode",
  "setAdditionalGlobals",
  "setSafeArea",
  "setTheme",
  "setWidgetData",
  "setWidgetView",
] as const;

/** 允许出现、但可以缺失的 port 名称。 */
export const OPTIONAL_PORT_NAMES = [
  "notifyMcpAppsMcpNotification",
  "prepareEnvironment",
  "runUserCode",
  "screenshot",
  "stop",
] as const;

export const ALL_ALLOWED_PORT_NAMES = [...REQUIRED_PORT_NAMES, ...OPTIONAL_PORT_NAMES] as const;

export function isAllowedSandboxHostname(hostname: string): boolean {
  return hostname === SANDBOX_DOMAIN || hostname.endsWith(`.${SANDBOX_DOMAIN}`);
}

export function isValidInitId(initId: string): boolean {
  return INIT_ID_PATTERN.test(initId);
}

export function tryParseUrl(urlString: string | null | undefined): URL | null {
  if (urlString == null) return null;
  try {
    return new URL(urlString);
  } catch {
    return null;
  }
}

/** 验证 URL 是否为允许的沙箱地址：https: 或 codex-sandbox:，无端口/凭据。 */
export function validateSandboxUrl(urlString: string | null | undefined): URL | null {
  const url = tryParseUrl(urlString);
  if (
    url == null ||
    (url.protocol !== "https:" && url.protocol !== "codex-sandbox:") ||
    url.port !== "" ||
    url.username !== "" ||
    url.password !== "" ||
    !isAllowedSandboxHostname(url.hostname)
  )
    return null;
  return url;
}

/** 从 URL 提取 targetOrigin；requireSkybridge 时还要求是 Skybridge 入口页。 */
export function getTargetOrigin(
  urlString: string,
  { requireSkybridge = false }: { requireSkybridge?: boolean } = {},
): string | null {
  const url = validateSandboxUrl(urlString);
  if (url == null) return null;
  if (requireSkybridge && (url.pathname !== "/" || url.searchParams.get("app") !== "skybridge"))
    return null;
  return `${url.protocol}//${url.host}`;
}

/** 从 URL hash 提取并校验 initId。 */
export function extractInitId(urlString: string): string | null {
  const url = tryParseUrl(urlString);
  if (url == null || url.hash.length === 0) return null;
  const initId = new URLSearchParams(url.hash.slice(1)).get(INIT_ID_PARAM);
  return initId != null && isValidInitId(initId) ? initId : null;
}

export function isValidPort(port: unknown): port is MessagePort {
  return (
    typeof port === "object" &&
    !!port &&
    typeof (port as MessagePort).postMessage === "function" &&
    typeof (port as MessagePort).start === "function"
  );
}

export const sandboxGuestPolicy = {
  REQUIRED_PORT_NAMES,
  ALL_ALLOWED_PORT_NAMES,
  isAllowedSandboxHostname,
  isValidInitId,
  tryParseUrl,
  validateSandboxUrl,
  getTargetOrigin,
  extractInitId,
  isValidPort,
};
