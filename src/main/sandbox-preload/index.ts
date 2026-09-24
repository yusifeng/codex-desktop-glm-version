// MCP App Sandbox 的 guest 侧 preload。
//
// 运行在 web-sandbox.oaiusercontent.com 的 iframe 里。宿主窗口通过
// postMessage 发来 init 消息（携带一组 MessagePort + 一个 replyPort）；
// 本模块验证 origin / initId / port 白名单后，把 port 所有权经 IPC 转交给
// 主进程，由主进程完成沙箱与宿主的对接。
import { ipcRenderer } from "electron";

/** 允许的沙箱主域（含子域）。 */
const SANDBOX_DOMAIN = "web-sandbox.oaiusercontent.com";

/** URL hash 中携带 initId 的参数名（#initId=...）。 */
const INIT_ID_PARAM = "initId";
/** initId 的合法字符集与长度。 */
const INIT_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/** 必须全部提供的 port 名称。 */
const REQUIRED_PORT_NAMES = [
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
const OPTIONAL_PORT_NAMES = [
  "notifyMcpAppsMcpNotification",
  "prepareEnvironment",
  "runUserCode",
  "screenshot",
  "stop",
] as const;

const ALL_ALLOWED_PORT_NAMES = [...REQUIRED_PORT_NAMES, ...OPTIONAL_PORT_NAMES];

/** 与主进程约定的 guest → main IPC 通道。 */
const MCP_SANDBOX_GUEST_CHANNEL = "codex_desktop:mcp-app-sandbox-guest-message";

function isAllowedSandboxHostname(hostname: string): boolean {
  return [SANDBOX_DOMAIN].some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

function isValidInitId(initId: string): boolean {
  return INIT_ID_PATTERN.test(initId);
}

function tryParseUrl(urlString: string | null | undefined): URL | null {
  if (urlString == null) return null;
  try {
    return new URL(urlString);
  } catch {
    return null;
  }
}

/** 验证 URL 是否为允许的沙箱地址：https: 或 codex-sandbox:，无端口/凭据，域名在白名单。 */
function validateSandboxUrl(urlString: string): URL | null {
  const url = tryParseUrl(urlString);
  if (
    url == null ||
    (url.protocol !== "https:" && url.protocol !== "codex-sandbox:") ||
    url.port !== "" ||
    url.username !== "" ||
    url.password !== "" ||
    !isAllowedSandboxHostname(url.hostname)
  ) {
    return null;
  }
  return url;
}

/** 从 URL 提取 targetOrigin；requireSkybridge 时还要求是 Skybridge 入口页。 */
function getTargetOrigin(
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
function extractInitId(urlString: string): string | null {
  const url = tryParseUrl(urlString);
  if (url == null || url.hash.length === 0) return null;
  const initId = new URLSearchParams(url.hash.slice(1)).get(INIT_ID_PARAM);
  return initId != null && isValidInitId(initId) ? initId : null;
}

function isValidPort(port: unknown): port is MessagePort {
  return (
    typeof port === "object" &&
    !!port &&
    typeof (port as MessagePort).postMessage === "function" &&
    typeof (port as MessagePort).start === "function"
  );
}

/** 防止重复初始化。 */
let initialized = false;

function isCurrentPageSkybridge(): boolean {
  return getTargetOrigin(window.location.href, { requireSkybridge: true }) === window.location.origin;
}

window.addEventListener("message", (event: MessageEvent) => {
  const messageType = event.data != null && typeof event.data === "object" ? event.data.type : void 0;
  if (
    event.source !== window ||
    !isCurrentPageSkybridge() ||
    event.data == null ||
    typeof event.data !== "object" ||
    messageType !== "init"
  ) {
    return;
  }
  const ports = event.data.ports;
  const replyPort = event.data.replyPort;
  if (typeof ports !== "object" || !ports || !isValidPort(replyPort) || initialized) return;

  const initId = extractInitId(window.location.href);
  if (initId == null) return;

  // 可选 port 只收集实际存在且合法的；必需 port 缺任何一个都拒绝初始化。
  const presentPortNames = ALL_ALLOWED_PORT_NAMES.filter((name) =>
    isValidPort(Reflect.get(ports, name)),
  );
  if (REQUIRED_PORT_NAMES.filter((name) => !isValidPort(Reflect.get(ports, name))).length > 0)
    return;

  const portList = [...presentPortNames];
  const portValues = portList.map((name) => {
    const port = Reflect.get(ports, name);
    if (!isValidPort(port)) throw new Error(`Missing required MCP sandbox frame port: ${name}`);
    return port;
  });

  initialized = true;
  ipcRenderer.postMessage(
    MCP_SANDBOX_GUEST_CHANNEL,
    { origin: window.location.origin, initId, portNames: portList, type: "init" },
    [...portValues, replyPort],
  );
});
