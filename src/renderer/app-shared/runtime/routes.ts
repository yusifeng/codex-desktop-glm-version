// app-shared：路由常量表与 codex:// deep-link 解析。
//
// 对应 app-shared-7b9edc1bfb7f.js 的 50230-50520 行区段（压缩名 → 语义）：
//   - KH()（50434-50460）：路由常量表（hotkey-window/debug/quick-chat/share/
//     skills/plugins/mcp-app/settings/local/remote 全部模板）+ 插件 id 正则
//     （plugins_<hash32> / (plugins~)?Plugin_<hash32> / plugin_<name> /
//     name@scope）+ 线程 deep-link schema（conversationId UUID + diffFilter
//     branch|last-turn + view:review + reviewPath）
//   - rWe/iWe/aWe/oWe/sWe/lWe（50240-50250）：线程路径构造（hotkey thread/
//     new-thread、hotkey remote、local、ca、remote）
//   - cWe（50252-50280）：线程 deep-link 解析（codex://threads/<uuid>?view=
//     review&diffFilter&path → openReview + 过滤条件）
//   - uWe（50282）：codex://skills → /skills 应用内路径
//   - gWe/_We（50290-50380）：codex://mcp-app 与 codex://plugins/<id>/app|
//     settings/<tool> deep-link 解析（plugin id 校验 + path 查询参数安全检查）
//   - dWe/fWe/pWe/mWe/hWe（50286）：插件页/工具页路径构造
//   - vWe/yWe/bWe/xWe/kH/SWe/CWe/wWe/TWe/EWe/DWe/OWe/AH/kWe/AWe/jWe：
//     plugin id 语义（scope 提取、curated/primary-runtime/internal-testing
//     判定、plugins~ 前缀归一、marketplace 前缀归属、encodeURIComponent
//     保留 @、deep-link 查询参数构造）
//   - dGe（50520）：不可信消息判定（untrustedAppMessage / mcp 附件）
//
// 与参考仓库 restored/runtime/persisted-signal/routes.ts 的机制一致
//（RouteLocation 判别联合 + MemoryRouter 在 app-initial），本模块承载其
// 常量与解析层。

// ---------------------------------------------------------------------------
// 路由常量表（原 `KH()` 内的全部常量）
// ---------------------------------------------------------------------------

export const HOTKEY_WINDOW_BASE = "/hotkey-window";
export const HOTKEY_WINDOW_ROUTE = HOTKEY_WINDOW_BASE; // 原 `MH`
export const HOTKEY_WINDOW_NEW_THREAD_ROUTE = `${HOTKEY_WINDOW_BASE}/new-thread`; // 原 `NH`
export const DEBUG_ROUTE = "/debug"; // 原 `MWe`
export const GLOBAL_DICTATION_ROUTE = "/global-dictation"; // 原 `NWe`/`PWe`
export const QUICK_CHAT_ROUTE = "/chatgpt/quick-chat"; // 原 `FWe`
export const QUICK_CHAT_PREWARM_ROUTE = "/chatgpt/quick-chat-prewarm"; // 原 `IWe`
export const QUICK_CHAT_THREAD_ROUTE = `${QUICK_CHAT_ROUTE}/:conversationId`; // 原 `LWe`
export const SHARE_BASE = "/share"; // 原 `PH`
export const SHARE_THREAD_ROUTE = `${SHARE_BASE}/:sharedConversationId`; // 原 `RWe`
export const SHARE_EMBED_THREAD_ROUTE = `${SHARE_BASE}/e/:sharedConversationId`; // 原 `zWe`
export const HOTKEY_THREAD_BASE = `${HOTKEY_WINDOW_BASE}/thread`; // 原 `FH`
export const HOTKEY_THREAD_ROUTE = `${HOTKEY_THREAD_BASE}/:conversationId`; // 原 `BWe`
export const HOTKEY_REMOTE_BASE = `${HOTKEY_WINDOW_BASE}/remote`; // 原 `IH`
export const HOTKEY_REMOTE_ROUTE = `${HOTKEY_REMOTE_BASE}/:taskId`; // 原 `VWe`
export const SKILLS_PLUGINS_ROUTE = "/skills/plugins"; // 原 `HWe`
export const PLUGINS_BASE = "/plugins"; // 原 `LH`
export const PLUGIN_ROUTE = `${PLUGINS_BASE}/:pluginId`; // 原 `UWe`
export const MCP_APP_BASE = "/mcp-app"; // 原 `RH`
export const MCP_APP_TOOL_ROUTE = `${MCP_APP_BASE}/:server/:toolName`; // 原 `WWe`
export const SETTINGS_PLUGINS_BASE = "/settings/plugins"; // 原 `zH`
export const SETTINGS_MCP_APP_TOOL_ROUTE = `${SETTINGS_PLUGINS_BASE}/:server/:toolName`; // 原 `GWe`
export const MCP_APP_PLUGIN_TOOL_ROUTE = `${MCP_APP_BASE}/plugins/:pluginId/:toolName`; // 原 `BH`/`KWe`
export const SKILLS_MANAGE_BASE = "/skills/manage"; // 原 `VH`
export const SKILLS_MANAGE_PLUGIN_ROUTE = `${SKILLS_MANAGE_BASE}/plugins/:pluginId`; // 原 `HH`/`qWe`
export const LOCAL_THREAD_BASE = "/local"; // 原 `UH`
export const LOCAL_THREAD_ROUTE = `${LOCAL_THREAD_BASE}/:conversationId`; // 原 `nGe`
export const CA_THREAD_ROUTE = "/ca/:conversationId"; // 原 `rGe`
export const REMOTE_THREAD_BASE = "/remote"; // 原 `WH`
export const REMOTE_THREAD_ROUTE = `${REMOTE_THREAD_BASE}/:taskId`; // 原 `sGe`

/** 应用内路由模板全集。 */
export const ROUTE_TEMPLATES = [
  HOTKEY_WINDOW_ROUTE,
  HOTKEY_WINDOW_NEW_THREAD_ROUTE,
  HOTKEY_THREAD_ROUTE,
  HOTKEY_REMOTE_ROUTE,
  DEBUG_ROUTE,
  GLOBAL_DICTATION_ROUTE,
  QUICK_CHAT_ROUTE,
  QUICK_CHAT_PREWARM_ROUTE,
  QUICK_CHAT_THREAD_ROUTE,
  SHARE_THREAD_ROUTE,
  SHARE_EMBED_THREAD_ROUTE,
  SKILLS_PLUGINS_ROUTE,
  SKILLS_MANAGE_PLUGIN_ROUTE,
  PLUGIN_ROUTE,
  MCP_APP_TOOL_ROUTE,
  MCP_APP_PLUGIN_TOOL_ROUTE,
  SETTINGS_MCP_APP_TOOL_ROUTE,
  LOCAL_THREAD_ROUTE,
  CA_THREAD_ROUTE,
  REMOTE_THREAD_ROUTE,
] as const;

// ---------------------------------------------------------------------------
// 插件 id 与 marketplace 语义（原 `vWe`~`wWe` + 常量）
// ---------------------------------------------------------------------------

export const OPENAI_CURATED_MARKETPLACE = "openai-curated"; // 原 `JWe`
export const OPENAI_CURATED_REMOTE_MARKETPLACE = "openai-curated-remote"; // 原 `YWe`
export const OPENAI_PRIMARY_RUNTIME = "openai-primary-runtime"; // 原 `XWe`
export const CHATGPT_WORKSPACE_MARKETPLACE = "chatgpt-workspace"; // 原 `ZWe`
export const OPENAI_INTERNAL_TESTING_MARKETPLACE = "openai-internal-testing"; // 原 `QWe`

/** plugins_<hash32> / (plugins~)?Plugin_<hash32> / plugin_<name>。 */
const HASH_PLUGIN_ID_PATTERN = /^(?:plugins_[0-9a-f]{32}|(?:plugins~)?Plugin_[0-9a-f]{32}|plugin_[A-Za-z0-9][A-Za-z0-9_-]{0,247})$/; // 原 `$We`
/** (plugins~)?Plugin_<hash32>（哈希形态，用于等价比较）。 */
const STRICT_HASH_PLUGIN_ID_PATTERN = /^(?:plugins~)?Plugin_[0-9a-f]{32}$/; // 原 `eGe`
/** name@scope 形态。 */
const NAMED_PLUGIN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,247}(?:@[A-Za-z0-9][A-Za-z0-9_-]{0,247})?$/; // 原 `tGe`

/** scope 提取（原 `vWe`）：name@scope → scope。 */
export function pluginScopeOf(pluginId: string): string | null {
  const atIndex = pluginId.lastIndexOf("@");
  return atIndex <= 0 || atIndex === pluginId.length - 1 ? null : pluginId.slice(atIndex + 1);
}

/** 官方 marketplace 判定（原 `yWe`）。 */
export function isOfficialMarketplace(name: string | null | undefined): boolean {
  return (
    name != null &&
    (name === OPENAI_CURATED_MARKETPLACE ||
      name === CHATGPT_WORKSPACE_MARKETPLACE ||
      name === OPENAI_PRIMARY_RUNTIME ||
      name === OPENAI_INTERNAL_TESTING_MARKETPLACE)
  );
}

/** plugin id 的 marketplace 是否官方（原 `bWe`）。 */
export function hasOfficialMarketplaceScope(pluginId: string): boolean {
  return isOfficialMarketplace(pluginScopeOf(pluginId));
}

/** 哈希 plugin id（原 `xWe`）。 */
export function isHashPluginId(pluginId: string): boolean {
  return HASH_PLUGIN_ID_PATTERN.test(pluginId);
}

/** 严格哈希形态（原 `kH`）。 */
export function isStrictHashPluginId(pluginId: string): boolean {
  return STRICT_HASH_PLUGIN_ID_PATTERN.test(pluginId);
}

/** plugins~ 前缀剥离（原 `OWe`）。 */
function canonicalPluginId(pluginId: string): string {
  return pluginId.startsWith("plugins~") ? pluginId.slice(8) : pluginId;
}

/** plugin id 等价（原 `SWe`）：全等或（双方哈希形态且归一后相等）。 */
export function pluginIdsEqual(a: string, b: string): boolean {
  return a === b
    ? true
    : !isStrictHashPluginId(a) || !isStrictHashPluginId(b)
      ? false
      : canonicalPluginId(a) === canonicalPluginId(b);
}

/** 官方或哈希 id（原 `CWe`）。 */
function officialOrHashPluginId(pluginId: string): string | null {
  return hasOfficialMarketplaceScope(pluginId) || isHashPluginId(pluginId) ? pluginId : null;
}

/** 合法 plugin id（原 `wWe`）：官方/哈希或 name@scope 形态。 */
export function validPluginId(pluginId: string): string | null {
  return officialOrHashPluginId(pluginId) ?? (NAMED_PLUGIN_ID_PATTERN.test(pluginId) ? pluginId : null);
}

/** 官方或哈希判定（原 `TWe`）。 */
export function isOfficialOrHashPluginId(pluginId: string): boolean {
  return officialOrHashPluginId(pluginId) != null;
}

/** marketplace 归属判定（原 `EWe`/`DWe`）：marketplacePath 前缀匹配。 */
export function isCuratedMarketplacePath(marketplacePath: string | null, marketplaceName = OPENAI_CURATED_MARKETPLACE): boolean {
  return marketplacePath ? marketplacePath === marketplaceName || marketplacePath.startsWith(`${marketplaceName}/`) : false;
}

/** URL 段解码（原 `AH`）：空/解码失败 → null。 */
function decodeSegment(segment: string | null | undefined): string | null {
  if (segment == null || segment.trim().length === 0) return null;
  try {
    const decoded = decodeURIComponent(segment).trim();
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

/** plugin id 编码（原 `kWe`）：保留 @。 */
function encodePluginId(pluginId: string): string {
  return encodeURIComponent(pluginId).replaceAll("%40", "@");
}

/** deep-link 查询参数（原 `AWe`/`jWe`）。 */
export interface PluginDeepLinkOptions {
  deepLinkMode?: string;
  hostId?: string;
  marketplacePath?: string;
  pluginName?: string;
  remoteMarketplaceName?: string;
}

function deepLinkQuery(options: PluginDeepLinkOptions): string {
  const params = new URLSearchParams();
  if (options.marketplacePath != null) params.set("marketplacePath", options.marketplacePath);
  if (options.remoteMarketplaceName != null) params.set("remoteMarketplaceName", options.remoteMarketplaceName);
  if (options.pluginName != null) params.set("pluginName", options.pluginName);
  if (options.deepLinkMode != null) params.set("mode", options.deepLinkMode);
  if (options.hostId != null) params.set("hostId", options.hostId);
  const query = params.toString();
  return query ? `?${query}` : "";
}

// ---------------------------------------------------------------------------
// 线程路径构造与 deep-link 解析（原 `rWe`~`sWe`/`cWe`/`lWe`）
// ---------------------------------------------------------------------------

/** hotkey 线程路径（原 `rWe`）。 */
export function hotkeyThreadPath(conversationId: string): string {
  return `${HOTKEY_THREAD_BASE}/${conversationId}`;
}

/** hotkey 新线程/线程路径二选一（原 `iWe`）。 */
export function hotkeyThreadOrNewThreadPath(isNewThread: boolean): string {
  return isNewThread ? HOTKEY_WINDOW_NEW_THREAD_ROUTE : HOTKEY_WINDOW_ROUTE;
}

/** hotkey 远程任务路径（原 `aWe`）。 */
export function hotkeyRemotePath(taskId: string): string {
  return `${HOTKEY_REMOTE_BASE}/${taskId}`;
}

/** 本地线程路径（原 `oWe`）。 */
export function localThreadPath(conversationId: string): string {
  return `${LOCAL_THREAD_BASE}/${conversationId}`;
}

/** CA 线程路径（原 `sWe`）。 */
export function caThreadPath(conversationId: string): string {
  return `/ca/${conversationId}`;
}

/** 远程任务路径（原 `lWe`）。 */
export function remoteThreadPath(taskId: string): string {
  return `${REMOTE_THREAD_BASE}/${taskId}`;
}

const CONVERSATION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i; // 原 `iGe`

/** 客户端草稿线程前缀（线程 id 语义，见 app-initial 的 `yFe` 校验）。 */
export const CLIENT_NEW_THREAD_PREFIX = "client-new-thread:";

/** 判定客户端草稿线程 id。 */
export function isClientNewThreadId(threadId: string): boolean {
  return threadId.startsWith(CLIENT_NEW_THREAD_PREFIX);
}

/** 线程 deep-link 解析结果。 */
export interface ThreadDeepLinkTarget {
  conversationId: string;
  openReview?: boolean;
  reviewDiffFilter?: "branch" | "last-turn";
  reviewPath?: string;
}

/**
 * 线程 deep-link 解析（原 `cWe`）：
 * `codex://threads/<uuid>[?view=review&diffFilter=branch|last-turn&path=…]`。
 * 校验 conversationId UUID、diffFilter/reviewPath 可空、多余路径段默认拒绝。
 */
export function parseThreadDeepLink(url: string | URL, { allowExtraPathSegments = false } = {}): ThreadDeepLinkTarget | null {
  let parsed: URL;
  try {
    parsed = typeof url == "string" ? new URL(url) : url;
  } catch {
    return null;
  }
  const [firstSegment, ...extraSegments] = parsed.pathname.split("/").filter(Boolean);
  const conversationId = firstSegment;
  if (conversationId == null || !CONVERSATION_ID_PATTERN.test(conversationId)) return null;
  const diffFilter = parsed.searchParams.get("diffFilter");
  if (diffFilter != null && diffFilter !== "branch" && diffFilter !== "last-turn") return null;
  const reviewPath = parsed.searchParams.get("path");
  if (reviewPath != null && reviewPath.length < 1) return null;
  const view = parsed.searchParams.get("view");
  if (view != null && view !== "review") return null;
  if (!allowExtraPathSegments && extraSegments.length > 0) return null;
  if (view === "review") {
    return diffFilter == null
      ? { conversationId, openReview: true }
      : { conversationId, openReview: true, reviewDiffFilter: diffFilter as "branch" | "last-turn", reviewPath: reviewPath ?? undefined };
  }
  return { conversationId };
}

// ---------------------------------------------------------------------------
// codex:// deep-link → 应用内路由（原 `uWe`）
// ---------------------------------------------------------------------------

/** codex://skills → /skills 路径（原 `uWe`）。 */
export function skillsDeepLinkRoute(url: string | URL): string | null {
  let parsed: URL;
  try {
    parsed = typeof url == "string" ? new URL(url) : url;
  } catch {
    return null;
  }
  return parsed.protocol !== "codex:" && parsed.protocol !== "codex-dev:" ||
    parsed.hostname !== "skills" ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.port !== ""
    ? null
    : `/skills${parsed.pathname === "" || parsed.pathname === "/" ? "" : parsed.pathname}${parsed.search}${parsed.hash}`;
}

// ---------------------------------------------------------------------------
// 插件/MCP 应用 deep-link（原 `gWe`/`_We`）
// ---------------------------------------------------------------------------

/** 插件 deep-link 目标。 */
export interface PluginDeepLinkTarget {
  entrypoint: "global" | "settings";
  pluginId: string;
  target: { path: string[]; query: Array<[string, string]> } | null;
  toolName: string;
}

function isCodexProtocol(parsed: URL): boolean {
  return parsed.protocol === "codex:" || parsed.protocol === "codex-dev:";
}

function hasNoCredentials(parsed: URL): boolean {
  return parsed.username === "" && parsed.password === "" && parsed.port === "";
}

/**
 * mcp-app deep-link 解析（原 `gWe`）：
 * `codex://mcp-app/<pluginId>/<toolName>[/<path…>][?query]` 或
 * `codex://settings/mcp-app/<pluginId>/<toolName>`（settings 入口）。
 */
export function parseMcpAppDeepLink(url: string | URL): PluginDeepLinkTarget | null {
  let parsed: URL;
  try {
    parsed = typeof url == "string" ? new URL(url) : url;
  } catch {
    return null;
  }
  if (parsed.host === "plugins") return parsePluginsHostDeepLink(parsed);
  const segments = parsed.pathname.split("/").filter(Boolean);
  const fromSettings = parsed.host === "settings" && ["mcp-app", "plugins"].includes(segments[0] ?? "");
  if (!isCodexProtocol(parsed) || (parsed.host !== "mcp-app" && !fromSettings) || !hasNoCredentials(parsed) || parsed.hash !== "") return null;
  const [serverSegment, toolSegment, ...restSegments] = segments.slice(Number(fromSettings));
  const pluginId = decodeSegment(serverSegment);
  const toolName = decodeSegment(toolSegment);
  if (pluginId == null || toolName == null || validPluginId(pluginId) == null) return null;
  const pathSegments: string[] = [];
  for (const segment of restSegments) {
    const decoded = decodeSegment(segment);
    if (decoded == null) return null;
    pathSegments.push(decoded);
  }
  const query = Array.from(parsed.searchParams.entries());
  return {
    entrypoint: fromSettings ? "settings" : "global",
    pluginId,
    target: pathSegments.length === 0 && query.length === 0 ? null : { path: pathSegments, query },
    toolName,
  };
}

/**
 * codex://plugins/<id>/app|settings/<tool> deep-link 解析（原 `_We`）：
 * path 查询参数（完整路径形态，含内嵌 query）做安全校验。
 */
function parsePluginsHostDeepLink(parsed: URL): PluginDeepLinkTarget | null {
  const [, idSegment, entrySegment, toolSegment, ...extraSegments] = parsed.pathname.split("/");
  const pluginId = decodeSegment(idSegment);
  const toolName = decodeSegment(toolSegment);
  const paths = parsed.searchParams.getAll("path");
  if (
    !isCodexProtocol(parsed) ||
    !hasNoCredentials(parsed) ||
    parsed.hash !== "" ||
    extraSegments.length !== 0 ||
    (entrySegment !== "app" && entrySegment !== "settings") ||
    pluginId == null ||
    validPluginId(pluginId) == null ||
    toolName == null ||
    paths.length > 1
  ) {
    return null;
  }
  const fullPath = paths[0] ?? "/";
  if (!fullPath.startsWith("/") || fullPath.startsWith("//") || /[\\#\u0000-\u0020\u007f]/.test(fullPath)) return null;
  const queryIndex = fullPath.indexOf("?");
  const pathPart = queryIndex === -1 ? fullPath : fullPath.slice(0, queryIndex);
  const queryPart = queryIndex === -1 ? "" : fullPath.slice(queryIndex + 1);
  try {
    return {
      entrypoint: entrySegment === "app" ? "global" : "settings",
      pluginId,
      toolName,
      target: {
        path: pathPart === "/" ? [] : pathPart.slice(1).split("/").map(decodeURIComponent),
        query: Array.from(new URLSearchParams(queryPart).entries()),
      },
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 插件页/工具页路径构造（原 `dWe`/`fWe`/`pWe`/`mWe`/`hWe`）
// ---------------------------------------------------------------------------

/** 插件详情页路径（原 `dWe`）。 */
export function pluginDetailPath(pluginId: string, options: PluginDeepLinkOptions): string {
  return `${PLUGINS_BASE}/${encodePluginId(pluginId)}${deepLinkQuery(options)}`;
}

/** skills 管理插件页路径（原 `fWe`）。 */
export function skillsManagePluginPath(pluginId: string, options: PluginDeepLinkOptions): string {
  return `${SKILLS_MANAGE_BASE}/plugins/${encodePluginId(pluginId)}${deepLinkQuery(options)}`;
}

/** mcp-app 工具页路径（原 `pWe`）。 */
export function mcpAppToolPath(server: string, toolName: string): string {
  return `${MCP_APP_BASE}/${encodeURIComponent(server)}/${encodeURIComponent(toolName)}`;
}

/** settings 插件工具页路径（原 `mWe`）。 */
export function settingsMcpAppToolPath(server: string, toolName: string): string {
  return `${SETTINGS_PLUGINS_BASE}/${encodeURIComponent(server)}/${encodeURIComponent(toolName)}`;
}

/** mcp-app 插件工具页路径（原 `hWe`）。 */
export function mcpAppPluginToolPath(pluginId: string, toolName: string): string {
  return `${MCP_APP_BASE}/plugins/${encodeURIComponent(pluginId)}/${encodeURIComponent(toolName)}`;
}

// ---------------------------------------------------------------------------
// 不可信消息判定（原 `dGe`）
// ---------------------------------------------------------------------------

/** mcp 附件（结构化子集）。 */
export interface McpAppModelContextAttachment {
  untrusted?: boolean;
}

/** app 消息载荷（结构化子集）。 */
export interface AppMessageLike {
  untrustedAppMessage?: unknown;
  mcpAppModelContextAttachments?: McpAppModelContextAttachment[];
}

/** 含不可信内容判定（原 `dGe`）。 */
export function hasUntrustedAppContent(payload: AppMessageLike): boolean {
  return payload.untrustedAppMessage != null || payload.mcpAppModelContextAttachments?.some((attachment) => attachment.untrusted === true) === true;
}
