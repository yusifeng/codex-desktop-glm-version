// deep link 解析：codex:// / codex-dev:// / https://chatgpt.com 全路由 → {kind} 判别联合，
// 以及 argv → 路由队列、chatgpt.com open-app URL → codex:// URL 的转换、外部 http(s) URL 消毒。
// 对应 bootstrap-C4dRql4x.ts 23379-23835 行
// （IO~QO 常量、$O/Z/Q/ek/tk 主解析器、nk~xk 各 kind 解析器、ok/sk/ck）。
import {
  Bc as isKnownBrowserFamily, // 浏览器家族注册表判定（内部符号 XS）
  Co as parseMcpAppDeepLink, // codex://mcp-app / plugins 深链解析（内部符号 Mk）
  Jo as sharedIdentity, // 原样返回（内部符号 tD；projectId 透传）
  Nf as urlSchema, // z.url 构造器（内部符号 Of）
  Of as stringSchema, // z.string 构造器（内部符号 U）
  Pf as cuidSchema, // z.cuid 构造器（内部符号 Cf）
  So as parseThreadDeepLink, // codex://threads/<id> 深链解析（内部符号 kk）
  bf as literalSchema, // z.literal 构造器（内部符号 Y）
  df as enumSchema, // z.enum 构造器（内部符号 J）
  ho as codexAppModeSchema, // z.enum(["chat","work","codex"])（内部符号 Ck）
  "if" as numberSchema, // 数字 schema 构造器（内部符号 ph；保留字导出 "if"）
  jf as unionSchema, // z.union 构造器（内部符号 Jp）
  vo as parsePluginId, // 插件 id 解析（内部符号 Rk）
  vl as isAbsolutePathLike, // 绝对路径（含 Windows 盘符 / UNC）判定（内部符号 Zb）
  xo as isKnownMarketplaceName, // 已知 marketplace 名判定（内部符号 Fk）
  yl as isNotNetworkUncPath, // 非网络路径（不以 // 或 \\ 开头）判定（内部符号 Xb）
  zf as zodNever, // zod NEVER 值（transform 失败返回；内部符号 tn）
} from "@chunk/shared";
import { identity, isLibfileName } from "../util/misc";
import { parseCodexUrl } from "./codex-url";

// d.ts 只给 stringSchema 声明了 safeParse；解析器需要 .regex()/.transform() 链式调用，放宽为 any。
const zString = stringSchema as (...args: any[]) => any;

// ---------------------------------------------------------------------------
// 常量（原 IO/LO/RO/zO/BO/VO/HO/UO/WO/GO/KO/qO/JO/YO/XO/ZO/QO）
// ---------------------------------------------------------------------------

/** 生产协议 scheme（原 IO）。 */
export const CODEX_PROTOCOL = "codex";
/** chatgpt.com 主机名（原 LO）。 */
export const CHATGPT_COM_HOST = "chatgpt.com";
/** chatgpt.com 的 open-app 落地路径（原 RO）。 */
export const OPEN_APP_PATH = "/codex/open-app";
/** 开发协议 scheme（原 zO）。 */
export const CODEX_DEV_PROTOCOL = "codex-dev";
/** 「打开项目」命令行参数（原 BO）。 */
export const OPEN_PROJECT_ARG = "--open-project";

/** pluginInstall 路由允许的查询参数（原 VO）。 */
const PLUGIN_INSTALL_ALLOWED_QUERY_PARAMS = new Set(["marketplace"]);
/** localPluginDetail 路由允许的查询参数（原 HO）。 */
const LOCAL_PLUGIN_DETAIL_ALLOWED_QUERY_PARAMS = new Set(["marketplacePath", "mode"]);
/** SSH 连接新增设置节（原 UO）。 */
const SSH_ADD_SETTINGS_SECTION = "connections/ssh/add";
/** SSH 连接新增允许的查询参数（原 WO）。 */
const SSH_ADD_ALLOWED_QUERY_PARAMS = new Set(["name", "alias", "projectPath", "enabled"]);
/** settings 路由可直达的设置节列表（原 GO）。 */
const SETTINGS_SECTIONS = [
  "browser-use",
  "chronicle",
  "connections",
  "connections/computer",
  "connections/devices",
  "connections/ssh",
  SSH_ADD_SETTINGS_SECTION,
];
/** petInstall 路由允许的查询参数（原 KO）。 */
const PET_INSTALL_ALLOWED_QUERY_PARAMS = new Set(["name", "description", "imageUrl", "spriteVersionNumber"]);

/** 宠物精灵版本号 schema：数字 1 或 2（原 qO）。 */
const spriteVersionNumberSchema = numberSchema()
  .pipe(unionSchema([literalSchema(1), literalSchema(2)]))
  .optional();
/** browserUrl 参数 schema：合法 URL 且协议为 http/https（原 JO）。 */
const browserUrlSchema = urlSchema().transform((value: string, ctx: any) => {
  const protocol = new URL(value).protocol;
  return protocol !== "http:" && protocol !== "https:"
    ? (ctx.addIssue({ code: "custom", message: "Invalid browser deep link URL" }), zodNever)
    : value;
});
/** browserTabId 参数 schema：1-128 位 [A-Za-z0-9_-]（原 YO）。 */
const browserTabIdSchema = zString().regex(/^[A-Za-z0-9_-]{1,128}$/).transform(identity);
/** browserActive 参数 schema："true"/"false" → boolean（原 XO）。 */
const browserActiveSchema = enumSchema(["true", "false"]).transform((value: string) => value === "true");
/** sage backfill browserTabId 形状（原 ZO）。 */
const SAGE_BACKFILL_TAB_ID_PATTERN = /^sage-backfill-[a-f0-9]{64}$/;
/** sage backfill browserUrl 主机形状（原 QO）。 */
const SAGE_BACKFILL_HOSTNAME_PATTERN =
  /^kepler(?:-[a-z0-9-]+)?\.gateway\.(?:data-0s|data-1)\.internal\.api\.openai\.org$/;

// ---------------------------------------------------------------------------
// 路由类型（判别联合；与原运行时各 {kind} 对象一一对应）
// ---------------------------------------------------------------------------

/** 库文件下载链接（https://chatgpt.com/api/library/files/<id>/download）。 */
export interface LibraryFileRoute {
  kind: "libraryFile";
  libraryFileId: string;
}

/** 体验激活（codex://activate/life_sciences）。 */
export interface ExperienceActivationRoute {
  kind: "experienceActivation";
  experience: "life_sciences";
}

/** 自动化列表（codex://automations）。 */
export interface AutomationsRoute {
  kind: "automations";
}

/** 单个自动化（codex://automations/<id>）。 */
export interface AutomationRoute {
  kind: "automation";
  automationId: string;
  automationSource: "cloud" | "local";
  edit: boolean;
}

/** codex-app 配置应用（codex://codex-app/apply-config）。 */
export interface ApplyCodexAppConfigRoute {
  kind: "applyCodexAppConfig";
}

/** 内置浏览器打开外部 URL（codex://browser?url=…）。 */
export interface BrowserRoute {
  kind: "browser";
  browserUrl: string;
}

/** 启动（codex://launch）。 */
export interface LaunchRoute {
  kind: "launch";
}

/** 线程深链附带的浏览器上下文参数（原 fk 的返回结构）。 */
export interface ThreadExtras {
  browserUrl?: string;
  prompt?: string;
  browserTabId?: string;
  browserActive?: boolean;
}

/** 新线程（codex://new、codex://threads/new、--open-project）。 */
export interface NewThreadRoute extends ThreadExtras {
  kind: "newThread";
  codexAppMode?: "chat" | "work" | "codex" | null;
  originUrl?: string | null;
  path?: string | null;
  projectId?: string;
}

/** 本地会话（codex://threads/<conversationId>）。 */
export interface LocalConversationRoute extends ThreadExtras {
  kind: "localConversation";
  conversationId: string;
  openReview?: true;
  reviewDiffFilter?: string | null;
  reviewPath?: string;
  hostId?: string;
}

/** 共享的 codex 快照（codex://shared-thread/<shareId>）。 */
export interface SharedCodexSnapshotRoute {
  kind: "sharedCodexSnapshot";
  shareId: string;
}

/** 技能页（codex://skills）。 */
export interface SkillsRoute {
  kind: "skills";
  search?: string;
}

/** 共享的 ChatGPT 会话（codex://chatgpt/share/<id>）。 */
export interface SharedChatGptConversationRoute {
  kind: "sharedChatGptConversation";
  sharedConversationId: string;
}

/** 设置页（codex://settings[/section]）。 */
export interface SettingsRoute {
  kind: "settings";
  section?: string;
  search?: string;
  hash?: string;
}

/** marketplace 插件安装（codex://plugins/install/<name>?marketplace=…）。 */
export interface PluginInstallRoute {
  kind: "pluginInstall";
  marketplaceName: string;
  pluginName: string;
}

/** 本地插件详情（codex://plugins/<name>?marketplacePath=…）。 */
export interface LocalPluginDetailRoute {
  kind: "localPluginDetail";
  hostId: string | null;
  marketplacePath: string;
  pluginName: string;
  openShareDialog: boolean;
}

/** 宠物安装（codex://pets/install?name=…&imageUrl=…）。 */
export interface PetInstallRoute {
  kind: "petInstall";
  name: string;
  description: string | null;
  imageUrl: string;
  spriteVersionNumber: 1 | 2 | undefined;
}

/** 插件详情（codex://plugins/<id>）。 */
export interface PluginDetailRoute {
  kind: "pluginDetail";
  hostId: string | null;
  pluginId: string;
}

/** mcp-app 深链目标（@chunk/shared 的 Mk 解析结果结构）。 */
export interface McpAppDeepLinkTarget {
  path: string[];
  query: [string, string][];
}

/** mcp-app 深链（codex://mcp-app/<pluginId>/<tool> 或 settings/mcp-app 入口）。 */
export interface McpAppDeepLink {
  entrypoint: "global" | "settings";
  pluginId: string;
  toolName: string;
  target: McpAppDeepLinkTarget | null;
}

/** 插件 MCP app 深链。 */
export interface PluginMcpAppRoute extends McpAppDeepLink {
  kind: "pluginMcpApp";
}

/** 连接器 OAuth 回调（codex://connector/oauth_callback）。 */
export interface ConnectorOAuthCallbackRoute {
  kind: "connectorOAuthCallback";
  fullRedirectUrl: string;
  returnTo: string | null;
}

/** 空间页路由（本解析器当前不产出；保留以兼容 sourceUrl 归因分支的判定）。 */
export interface SpacePageRoute {
  kind: "spacePage";
}

/** deep link 路由判别联合（原 tk 的返回结构）。 */
export type DeepLinkRoute =
  | LibraryFileRoute
  | ExperienceActivationRoute
  | AutomationsRoute
  | AutomationRoute
  | ApplyCodexAppConfigRoute
  | BrowserRoute
  | LaunchRoute
  | NewThreadRoute
  | LocalConversationRoute
  | SharedCodexSnapshotRoute
  | SkillsRoute
  | SharedChatGptConversationRoute
  | SettingsRoute
  | PluginInstallRoute
  | LocalPluginDetailRoute
  | PetInstallRoute
  | PluginDetailRoute
  | PluginMcpAppRoute
  | ConnectorOAuthCallbackRoute
  | SpacePageRoute;

/** argv 解析出的 deep link 条目（原 ok 的返回结构）。 */
export interface ArgvDeepLink {
  route: DeepLinkRoute;
  /** 归因来源 URL（仅 OS deep link 条目存在；undefined 表示不归因）。 */
  sourceUrl?: string;
  isOsDeepLink?: boolean;
}

// ---------------------------------------------------------------------------
// 基础工具（原 $O/Z/Q/yk/gk/ck/xk）
// ---------------------------------------------------------------------------

/**
 * 解析应用协议 scheme（原 $O）：打包构建或 Windows/Linux 用 codex，
 * 其余（未打包的 macOS）用 codex-dev。
 */
export function resolveProtocolScheme(isPackaged: boolean, platform: string = process.platform): string {
  return isPackaged || platform === "win32" || platform === "linux" ? CODEX_PROTOCOL : CODEX_DEV_PROTOCOL;
}

/** 取 URL 路径的非空段（原 Z）。 */
function getPathSegments(url: URL): string[] {
  return url.pathname.split("/").filter(Boolean);
}

/** 取查询参数：缺失或全空白返回 null，否则返回原始（未 trim 的）值（原 Q）。 */
function getQueryParam(url: URL, name: string): string | null {
  const value = url.searchParams.get(name);
  return value == null || value.trim().length === 0 ? null : value;
}

/** decodeURIComponent + trim；解码失败或结果为空返回 null（原 yk）。 */
function decodePathSegment(value: string | null | undefined): string | null {
  if (value == null || value.trim().length === 0) return null;
  try {
    const decoded = decodeURIComponent(value).trim();
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

/** URL 的查询参数是否只包含允许集合内的键（原 gk）。 */
function hasOnlyQueryParams(url: URL, allowed: Set<string>): boolean {
  for (const key of url.searchParams.keys()) if (!allowed.has(key)) return false;
  return true;
}

/** 是否为 Windows 绝对路径（盘符开头或 UNC 前缀；原 ck）。 */
export function isWindowsAbsolutePath(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length === 0 ? false : /^[a-zA-Z]:[\\/]/.test(trimmed) || trimmed.startsWith("\\\\");
}

/**
 * 消毒外部 http(s) URL（原 xk）：首尾空白、非 http/https 协议、空主机、
 * 携带凭据的 URL 一律拒绝；通过则返回规范化后的 URL 字符串。
 */
export function sanitizeHttpUrl(urlString: string): string | null {
  if (urlString.trim() !== urlString) return null;
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return null;
  }
  return (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.hostname === "" ||
    url.username !== "" ||
    url.password !== ""
    ? null
    : url.toString();
}

// ---------------------------------------------------------------------------
// chatgpt.com open-app URL → codex:// URL（原 ek）
// ---------------------------------------------------------------------------

/**
 * 把 https://chatgpt.com/codex/open-app 落地 URL 转换为 codex:// URL（原 ek）。
 * cli-login 来源、携带凭据/端口/fragment 的拒绝；target=plugin → codex://plugins/<id>，
 * target=launch → codex://launch，其余 → codex://threads/<id|new>（附带
 * hostId/prompt/mode/browserUrl 参数）。
 */
export function convertOpenAppUrl(urlString: string): string | null {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return null;
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== CHATGPT_COM_HOST ||
    url.pathname !== OPEN_APP_PATH ||
    url.username !== "" ||
    url.password !== "" ||
    url.port !== "" ||
    url.hash !== "" ||
    url.searchParams.get("source") === "cli-login"
  )
    return null;
  const pluginId = url.searchParams.get("plugin_id")?.trim();
  if (url.searchParams.get("target") === "plugin" && pluginId)
    return `codex://plugins/${encodeURIComponent(pluginId)}`;
  if (url.searchParams.get("target") === "launch") return "codex://launch";
  const threadId = cuidSchema.safeParse(url.searchParams.get("codex_thread_id")?.trim()).data;
  const threadUrl = new URL(`codex://threads/${threadId ?? "new"}`);
  const hostId = url.searchParams.get("hostId")?.trim();
  if (threadId != null && hostId) threadUrl.searchParams.set("hostId", hostId);
  const prompt = url.searchParams.get("q")?.trim();
  const modes = url.searchParams.getAll("mode");
  const modeParse = modes.length === 1 ? codexAppModeSchema.safeParse(modes[0]) : null;
  let codexAppMode = modeParse?.success === true ? modeParse.data : null;
  if (
    codexAppMode == null &&
    modes.length === 0 &&
    url.searchParams.get("fallback") === "work" &&
    prompt != null &&
    prompt.length > 0
  )
    codexAppMode = "work";
  if (prompt != null && prompt.length > 0) threadUrl.searchParams.set("prompt", prompt);
  if (threadId == null && codexAppMode != null) threadUrl.searchParams.set("mode", codexAppMode);
  const browserUrlParam = url.searchParams.get("browserUrl");
  const sanitizedBrowserUrl = browserUrlParam == null ? null : sanitizeHttpUrl(browserUrlParam);
  if (sanitizedBrowserUrl != null) threadUrl.searchParams.set("browserUrl", sanitizedBrowserUrl);
  return threadUrl.toString();
}

// ---------------------------------------------------------------------------
// 各 kind 解析器（原 nk~xk）
// ---------------------------------------------------------------------------

/** 解析 codex://shared-thread/<shareId>（原 nk）。 */
function parseSharedThreadRoute(url: URL): SharedCodexSnapshotRoute | null {
  const [shareId, second] = getPathSegments(url);
  return shareId == null ||
    !/^cx_[0-9a-f]{32}$/.test(shareId) ||
    second != null ||
    url.username !== "" ||
    url.password !== "" ||
    url.port !== "" ||
    url.hash !== "" ||
    url.search !== ""
    ? null
    : { kind: "sharedCodexSnapshot", shareId };
}

/** 解析 codex://skills（原 rk）。 */
function parseSkillsRoute(url: URL): SkillsRoute {
  const category = url.searchParams.get("category");
  return category == null
    ? { kind: "skills" }
    : { kind: "skills", search: `?${new URLSearchParams({ category }).toString()}` };
}

/** 解析 codex://chatgpt/share/<id>（含 /share/e/<id> 短链形式；原 ik）。 */
function parseSharedConversationRoute(url: URL): SharedChatGptConversationRoute | null {
  const [first, second, third, fourth] = getPathSegments(url);
  if (first !== "share" || fourth != null || url.searchParams.size !== 0) return null;
  let id = second;
  if (second === "e") id = third;
  else if (third != null) return null;
  const sharedConversationId = decodePathSegment(id);
  return sharedConversationId == null
    ? null
    : { kind: "sharedChatGptConversation", sharedConversationId };
}

/** 解析 codex://settings[/section]（原 ak）。 */
function parseSettingsRoute(url: URL): SettingsRoute {
  const segments = getPathSegments(url);
  const joined = segments.join("/");
  const [, second, third] = segments;
  let browserFamily: string | null = null;
  if (second === "google-chrome") browserFamily = "chrome";
  else if (second != null && isKnownBrowserFamily(second)) browserFamily = second;
  const section =
    segments[0] === "computer-use" && third == null && browserFamily != null
      ? `computer-use/${browserFamily}`
      : SETTINGS_SECTIONS.find((candidate) => candidate === joined);
  if (section == null) return { kind: "settings" };
  const route: SettingsRoute = { kind: "settings", section };
  if (section === SSH_ADD_SETTINGS_SECTION) {
    const name = getQueryParam(url, "name")?.trim();
    const alias = getQueryParam(url, "alias")?.trim();
    const effectiveName = name ?? alias;
    const projectPath = getQueryParam(url, "projectPath")?.trim();
    const enabled = getQueryParam(url, "enabled")?.trim();
    if (
      effectiveName == null ||
      (name != null && alias != null && name !== alias) ||
      (url.searchParams.has("projectPath") && projectPath == null) ||
      (url.searchParams.has("enabled") && enabled !== "true" && enabled !== "false") ||
      !hasOnlyQueryParams(url, SSH_ADD_ALLOWED_QUERY_PARAMS)
    )
      return { kind: "settings", section: "connections/ssh" };
    const params = new URLSearchParams({ name: effectiveName });
    if (projectPath != null) params.set("projectPath", projectPath);
    if (enabled != null) params.set("enabled", enabled);
    route.search = `?${params.toString()}`;
  }
  if (url.hash !== "") route.hash = url.hash;
  return route;
}

/** 解析 codex://codex-app/apply-config（原 lk）。 */
function parseCodexAppRoute(url: URL): ApplyCodexAppConfigRoute | null {
  const [first] = getPathSegments(url);
  return first === "apply-config" ? { kind: "applyCodexAppConfig" } : null;
}

/** 解析 codex://browser?url=…（原 uk；rawUrl 用于拒绝携带 fragment 原文的情形）。 */
function parseBrowserRoute(url: URL, rawUrl: string): BrowserRoute | null {
  const targetParam = url.searchParams.get("url");
  if (
    url.pathname !== "" ||
    url.username !== "" ||
    url.password !== "" ||
    url.port !== "" ||
    url.hash !== "" ||
    rawUrl.includes("#") ||
    url.searchParams.size !== 1 ||
    targetParam == null
  )
    return null;
  const browserUrl = sanitizeHttpUrl(targetParam);
  return browserUrl == null ? null : { kind: "browser", browserUrl };
}

/** 解析线程附带的浏览器上下文参数（原 fk）：prompt/browserUrl/browserTabId/browserActive。 */
function parseThreadExtras(url: URL): ThreadExtras | null {
  const prompt = getQueryParam(url, "prompt");
  const browserTabIdParam = url.searchParams.get("browserTabId");
  const browserTabIdParse = browserTabIdParam == null ? null : browserTabIdSchema.safeParse(browserTabIdParam);
  const browserActiveParam = url.searchParams.get("browserActive");
  const browserActiveParse = browserActiveParam == null ? null : browserActiveSchema.safeParse(browserActiveParam);
  const browserUrlParam = url.searchParams.get("browserUrl");
  const browserUrlParse = browserUrlParam == null ? null : browserUrlSchema.safeParse(browserUrlParam);
  if (
    (browserUrlParse != null && !browserUrlParse.success) ||
    (browserTabIdParse != null && !browserTabIdParse.success) ||
    (browserActiveParse != null && !browserActiveParse.success) ||
    (browserUrlParse == null && (browserTabIdParse != null || browserActiveParse != null)) ||
    (browserActiveParse != null && browserTabIdParse == null)
  )
    return null;
  if (browserActiveParse?.data === false) {
    // browserActive=false：仅允许 sage backfill 网关 URL + sage-backfill tab id。
    if (
      browserUrlParse == null ||
      !browserUrlParse.success ||
      browserTabIdParse == null ||
      !browserTabIdParse.success ||
      !SAGE_BACKFILL_TAB_ID_PATTERN.test(browserTabIdParse.data)
    )
      return null;
    const backfillUrl = new URL(browserUrlParse.data);
    if (
      backfillUrl.protocol !== "https:" ||
      backfillUrl.username !== "" ||
      backfillUrl.password !== "" ||
      backfillUrl.port !== "" ||
      backfillUrl.hash !== "" ||
      !SAGE_BACKFILL_HOSTNAME_PATTERN.test(backfillUrl.hostname) ||
      backfillUrl.pathname !== "/backfill" ||
      backfillUrl.searchParams.size !== 2 ||
      backfillUrl.searchParams.get("backfillUi") !== "sage" ||
      !backfillUrl.searchParams.get("sageBackfillId")
    )
      return null;
  }
  const extras: ThreadExtras = { browserUrl: browserUrlParse?.data, prompt: prompt ?? undefined };
  if (browserTabIdParse != null) extras.browserTabId = browserTabIdParse.data;
  if (browserActiveParse != null) extras.browserActive = browserActiveParse.data;
  return extras;
}

/** 解析 codex://new / codex://threads/new（原 dk）。 */
function parseNewThreadRoute(url: URL): NewThreadRoute | null {
  const extras = parseThreadExtras(url);
  const modes = url.searchParams.getAll("mode");
  const originUrl = getQueryParam(url, "originUrl");
  const path = getQueryParam(url, "path");
  const projectId = getQueryParam(url, "projectId");
  let codexAppMode: "chat" | "work" | "codex" | undefined;
  if (modes.length > 1) return null;
  if (modes.length === 1) {
    const parsed = codexAppModeSchema.safeParse(modes[0]);
    if (!parsed.success) return null;
    codexAppMode = parsed.data;
  }
  return extras == null ||
    (path != null && !isNotNetworkUncPath(path)) ||
    (extras.prompt == null &&
      extras.browserUrl == null &&
      codexAppMode == null &&
      originUrl == null &&
      path == null &&
      projectId == null)
    ? null
    : {
        codexAppMode,
        kind: "newThread",
        originUrl,
        path,
        projectId: projectId == null ? undefined : sharedIdentity(projectId),
        ...extras,
      };
}

/** 解析 codex://plugins/install/<name>?marketplace=…（原 pk）。 */
function parsePluginInstallRoute(url: URL): PluginInstallRoute | null {
  const [first, second, third] = getPathSegments(url);
  if (first !== "install" || third != null) return null;
  const pluginName = decodePathSegment(second);
  if (pluginName == null || !hasOnlyQueryParams(url, PLUGIN_INSTALL_ALLOWED_QUERY_PARAMS)) return null;
  const marketplaceName = getQueryParam(url, "marketplace")?.trim();
  return isKnownMarketplaceName(marketplaceName)
    ? { kind: "pluginInstall", marketplaceName: marketplaceName!, pluginName }
    : null;
}

/** 解析 codex://plugins/<name>?marketplacePath=…（原 mk）。 */
function parseLocalPluginDetailRoute(url: URL): LocalPluginDetailRoute | null {
  const [first, second] = getPathSegments(url);
  if (second != null || !hasOnlyQueryParams(url, LOCAL_PLUGIN_DETAIL_ALLOWED_QUERY_PARAMS)) return null;
  const pluginName = decodePathSegment(first);
  const marketplacePath = getQueryParam(url, "marketplacePath")?.trim();
  const mode = getQueryParam(url, "mode")?.trim();
  return pluginName == null ||
    marketplacePath == null ||
    (mode != null && mode !== "share") ||
    !isAbsolutePathLike(marketplacePath) ||
    !isNotNetworkUncPath(marketplacePath)
    ? null
    : {
        kind: "localPluginDetail",
        hostId: null,
        marketplacePath,
        pluginName,
        openShareDialog: mode === "share",
      };
}

/** 解析 codex://pets/install?name=…&imageUrl=…（原 hk）。 */
function parsePetInstallRoute(url: URL): PetInstallRoute | null {
  const [first, second] = getPathSegments(url);
  if (first !== "install" || second != null || !hasOnlyQueryParams(url, PET_INSTALL_ALLOWED_QUERY_PARAMS))
    return null;
  const name = getQueryParam(url, "name")?.trim();
  const description = getQueryParam(url, "description")?.trim() ?? null;
  const imageUrlParam = getQueryParam(url, "imageUrl");
  const spriteVersionParse = spriteVersionNumberSchema.safeParse(
    getQueryParam(url, "spriteVersionNumber") ?? undefined,
  );
  if (name == null || imageUrlParam == null || !spriteVersionParse.success) return null;
  try {
    const imageUrl = new URL(imageUrlParam);
    return imageUrl.protocol === "https:"
      ? {
          kind: "petInstall",
          name,
          description,
          imageUrl: imageUrl.toString(),
          spriteVersionNumber: spriteVersionParse.data,
        }
      : null;
  } catch {
    return null;
  }
}

/** 解析 codex://plugins/<pluginId>（原 _k）。 */
function parsePluginDetailRoute(url: URL): PluginDetailRoute | null {
  const [first, second] = getPathSegments(url);
  if (second != null) return null;
  const pluginName = decodePathSegment(first);
  if (pluginName == null) return null;
  const pluginId = parsePluginId(pluginName);
  return pluginId == null ? null : { kind: "pluginDetail", hostId: getQueryParam(url, "hostId"), pluginId };
}

/** 解析 codex://mcp-app/… 与 codex://settings/mcp-app|plugins 入口（原 vk）。 */
function parsePluginMcpAppRoute(url: URL): PluginMcpAppRoute | null {
  const mcpApp = parseMcpAppDeepLink(url);
  return mcpApp == null ? null : ({ kind: "pluginMcpApp", ...mcpApp } as PluginMcpAppRoute);
}

/** 解析 codex://connector/oauth_callback（原 bk；fullRedirectUrl 保留原始完整 URL）。 */
function parseConnectorRoute(url: URL, rawUrl: string): ConnectorOAuthCallbackRoute | null {
  const [first] = getPathSegments(url);
  return first === "oauth_callback"
    ? { kind: "connectorOAuthCallback", fullRedirectUrl: rawUrl, returnTo: getQueryParam(url, "returnTo") }
    : null;
}

// ---------------------------------------------------------------------------
// 主解析器（原 tk）与 argv 解析（原 ok）/ 归因（原 sk）
// ---------------------------------------------------------------------------

/**
 * 解析 deep link URL 为路由（原 tk）。
 * https://chatgpt.com URL 走库文件下载 / open-app 转换 / 共享会话分支；
 * 其余必须是 codex: / codex-dev: 协议，按目标主机分发到各 kind 解析器。
 */
export function parseDeepLink(urlString: string): DeepLinkRoute | null {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return null;
  }
  if (url.protocol === "https:") {
    if (
      url.hostname !== CHATGPT_COM_HOST ||
      url.username !== "" ||
      url.password !== "" ||
      url.port !== "" ||
      url.hash !== ""
    )
      return null;
    const libraryFileId =
      /^https:\/\/chatgpt\.com\/api\/library\/files\/([^/]+)\/download$/.exec(urlString)?.[1];
    if (urlString === url.href && libraryFileId != null && isLibfileName(libraryFileId))
      return { kind: "libraryFile", libraryFileId };
    const codexUrl = convertOpenAppUrl(urlString);
    return codexUrl == null ? parseSharedConversationRoute(url) : parseDeepLink(codexUrl);
  }
  const parsed = parseCodexUrl(url);
  if (parsed == null) return null;
  switch (parsed.destination) {
    case "plugins":
      return (
        parsePluginMcpAppRoute(url) ??
        parsePluginInstallRoute(url) ??
        parseLocalPluginDetailRoute(url) ??
        parsePluginDetailRoute(url)
      );
    case "mcp-app":
      return parsePluginMcpAppRoute(url);
    case "activate":
      return urlString === `${url.protocol}//activate/life_sciences`
        ? { kind: "experienceActivation", experience: "life_sciences" }
        : null;
    case "pets":
      return parsePetInstallRoute(url);
    case "automations": {
      const [first, second] = getPathSegments(url);
      if (first == null) return { kind: "automations" };
      const automationId = decodePathSegment(first);
      const sourceParse = enumSchema(["cloud", "local"]).safeParse(
        url.searchParams.get("automationSource") ?? "cloud",
      );
      return automationId == null || second != null || !sourceParse.success
        ? null
        : {
            kind: "automation",
            automationId,
            automationSource: sourceParse.data,
            edit: url.searchParams.get("edit") === "true",
          };
    }
    case "codex-app":
      return parseCodexAppRoute(url);
    case "connector":
      return parseConnectorRoute(url, urlString);
    case "chatgpt":
      return parseSharedConversationRoute(url);
    case "browser":
      return parseBrowserRoute(url, urlString);
    case "launch":
      return getPathSegments(url).length === 0 ? { kind: "launch" } : null;
    case "new":
      return parseNewThreadRoute(url);
    case "settings":
      return ["mcp-app", "plugins"].includes(getPathSegments(url)[0] ?? "")
        ? parsePluginMcpAppRoute(url)
        : parseSettingsRoute(url);
    case "shared-thread":
      return parseSharedThreadRoute(url);
    case "space":
      return null;
    case "skills":
      return parseSkillsRoute(url);
    case "threads": {
      if (getPathSegments(url)[0] === "new")
        return ["browserUrl", "mode", "originUrl", "path", "prompt"].some((param) =>
          url.searchParams.has(param),
        )
          ? parseNewThreadRoute(url)
          : { kind: "newThread" };
      const threadRoute = parseThreadDeepLink(url, { allowExtraPathSegments: true });
      const extras = parseThreadExtras(url);
      return threadRoute == null || extras == null
        ? null
        : ({
            kind: "localConversation",
            ...threadRoute,
            ...extras,
            hostId: getQueryParam(url, "hostId") ?? undefined,
          } as LocalConversationRoute);
    }
    default:
      return null;
  }
}

/**
 * 解析 argv 为 deep link 条目队列（原 ok）：
 * --open-project <path> / --open-project=<path> → newThread 路由；
 * 可解析为 deep link 的参数 → 对应路由（标记 isOsDeepLink 并计算归因 sourceUrl）；
 * allowBareWindowsProjectPathArg 时，非首位的 Windows 绝对路径参数也视为打开项目。
 */
export function parseArgvRoutes(
  argv: string[],
  { allowBareWindowsProjectPathArg = false }: { allowBareWindowsProjectPathArg?: boolean } = {},
): ArgvDeepLink[] {
  const entries: ArgvDeepLink[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === OPEN_PROJECT_ARG) {
      const projectPath = argv[index + 1]?.trim();
      index += 1;
      if (projectPath) entries.push({ route: { kind: "newThread", path: projectPath } });
      continue;
    }
    if (arg.startsWith(`${OPEN_PROJECT_ARG}=`)) {
      const projectPath = arg.slice(15).trim();
      if (projectPath) entries.push({ route: { kind: "newThread", path: projectPath } });
      continue;
    }
    const route = parseDeepLink(arg);
    if (route) {
      entries.push({ route, sourceUrl: computeDeepLinkSourceUrl(route, arg), isOsDeepLink: true });
      continue;
    }
    if (allowBareWindowsProjectPathArg && index > 0 && isWindowsAbsolutePath(arg))
      entries.push({ route: { kind: "newThread", path: arg } });
  }
  return entries;
}

/**
 * 计算 OS deep link 的归因来源 URL（原 sk）。
 * chatgpt.com open-app URL 只保留 utm 参数；spacePage / sharedCodexSnapshot /
 * libraryFile / connectorOAuthCallback / connections/ssh/add / 带 browserUrl 的路由
 * 各有特殊归因或明确不归因（undefined）；其余返回原始 URL。
 */
export function computeDeepLinkSourceUrl(route: DeepLinkRoute, urlString: string): string | undefined {
  const url = new URL(urlString);
  if (url.protocol === "https:" && url.hostname === CHATGPT_COM_HOST && url.pathname === OPEN_APP_PATH) {
    const utmParams = new URLSearchParams();
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
      const value = url.searchParams.get(key)?.trim();
      if (value) utmParams.set(key, value);
    }
    url.search = utmParams.toString();
    return url.toString();
  }
  if (route.kind === "spacePage") return "codex://space";
  if (route.kind === "libraryFile") return undefined;
  if (route.kind === "sharedCodexSnapshot")
    return "codex://shared-thread?utm_source=shared_thread_viewer";
  const settingsPath = route.kind === "settings" ? getPathSegments(url).join("/") : null;
  return route.kind !== "connectorOAuthCallback" &&
    settingsPath !== SSH_ADD_SETTINGS_SECTION &&
    !("browserUrl" in route && route.browserUrl != null)
    ? urlString
    : undefined;
}
