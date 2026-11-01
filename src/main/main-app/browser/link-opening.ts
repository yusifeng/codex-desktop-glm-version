// 链接打开决策：URL 校验工具簇 + 打开目标求解 + Slack 原生应用提升。
//
// 对应 main-C-Mhak1n.ts 380-530（URL/路由身份工具簇）与 95,582-95,859（link-opening）：
//   - ze/Be/Ve/He/Ue/We/Ge/Ke/qe/Je/Ye/Xe/Ze：URL 判定（本地回环、file:、
//     自定义协议白名单）与打开目标求解（in-app-browser / external-browser）
//   - Qe/$e/et/tt/nt/rt/it：浏览器路由身份常量（partition 前缀、线程 tab 键、
//     页面恢复属性）
//   - MH/IH：打开链接总入口（openTarget 决策 → codex deep link → Slack 原生 →
//     toggle-browser-panel inline 消息 → prompt-link-destination → shell.openExternal）
//   - mBe/hBe/LH/gBe/_Be/vBe/yBe/bBe：Slack 链接解析（archives/client/app_redirect
//     形态 → slack:// channel 深链；slack.com/api/auth.findTeam 解析 team_id + 缓存）
//
// 消费者：checkout-webview、workspace-settings-webview、R8 IAB manager 等复用
// openLinkInPreferredTarget 与 URL 判定工具。
//
// 模块加载期副作用：仅 logger 与常量，无 I/O、无监听。

import { shell, net } from "electron";
import { randomUUID } from "node:crypto";
import {
  wf as objectSchema,
  Of as stringSchema,
  bf as literalSchema,
  Ia as openLinkTargetPreference,
  ef as defaultOpenTargetPreference,
  Zo as toError,
  bl as isLocalFilePath,
  xl as isUncPath,
  Tl as platformNormalizePath,
  El as normalizePosixPath,
} from "@chunk/shared";
import { memoizedTaggedLogger } from "@chunk/logger";
import { getDesktopFeatureAvailability } from "../misc/availability";

const logger = memoizedTaggedLogger("link-opening");

// ---------------------------------------------------------------------------
// URL 判定与路由身份工具（原 380-530 行的 `ze`~`Ze` + `Qe`~`it`）
// ---------------------------------------------------------------------------

const HTML_FILE_PATTERN = /\.html?$/i;
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]", "::1"]);
const EXTERNAL_LINK_PROTOCOLS = new Set(["mailto:", "sms:", "tel:"]);
const VSCODE_ALLOWED_HOSTS = new Set(["file", "vscode-remote"]);

export function isHtmlFileName(path: string): boolean {
  return HTML_FILE_PATTERN.test(path);
}

/** 回环/本地主机名（原 `Be`：.localhost 后缀或白名单）。 */
function isLocalHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized.endsWith(".localhost") || LOCAL_HOSTNAMES.has(normalized);
}

/** 本地 http(s) 端口（原 `He`）：回环主机返回端口，其余 null。 */
export function localHttpPort(url: string): number | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  return (parsed.protocol !== "http:" && parsed.protocol !== "https:") || !isLocalHostname(parsed.hostname)
    ? null
    : Number(parsed.port || (parsed.protocol === "https:" ? 443 : 80));
}

/** 本地 URL（原 `Ve`）：本地 http(s) 或本地 file:。 */
export function isLocalUrl(url: string): boolean {
  if (localHttpPort(url) != null) return true;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return parsed.protocol === "file:" && isLocalFileUrl(parsed);
}

/** in-app-browser 判定（原 `Ue`）。 */
export function shouldOpenLinkInAppBrowser({
  browserPaneEnabled,
  link,
  openLinkInTargetPreference = defaultOpenTargetPreference,
  openLocalUrlInTargetPreference = defaultOpenTargetPreference,
}: {
  browserPaneEnabled: boolean;
  link:
    | { type: "file"; path: string; target?: unknown; location?: unknown }
    | { type: "url"; url: string; target?: unknown; location?: unknown };
  openLinkInTargetPreference?: string;
  openLocalUrlInTargetPreference?: string;
}): boolean {
  if (!browserPaneEnabled) return false;
  switch (link.type) {
    case "file":
      return link.target == null && link.location == null && isHtmlFileName(link.path);
    case "url":
      return isLocalUrl(link.url) ? openLocalUrlInTargetPreference === "in-app-browser" : openLinkInTargetPreference === "in-app-browser" && isHttpUrl(link.url);
  }
}

/** 可外开 URL（原 `We`）：file/http/https 或白名单协议。 */
export function isSupportedExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "file:" || parsed.protocol === "http:" || parsed.protocol === "https:" || isAllowedCustomProtocol(parsed);
  } catch {
    return false;
  }
}

/** https 或本地 http（原 `Ge`）。 */
export function isSecureOrLocalHttpUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || (protocol === "http:" && isLocalUrl(url));
  } catch {
    return false;
  }
}

/** 打开目标求解（原 `Ke`）。 */
export function resolveLinkOpenTarget({
  browserPaneEnabled,
  openLinkInTargetPreference = defaultOpenTargetPreference,
  openLocalUrlInTargetPreference = defaultOpenTargetPreference,
  openTarget,
  url,
  useExternalBrowser,
}: {
  browserPaneEnabled: boolean;
  openLinkInTargetPreference?: string;
  openLocalUrlInTargetPreference?: string;
  openTarget?: string;
  url: string;
  useExternalBrowser?: boolean;
}): "in-app-browser" | "external-browser" {
  return useExternalBrowser === true || openTarget === "external-browser"
    ? "external-browser"
    : shouldOpenLinkInAppBrowser({
        browserPaneEnabled,
        link: { type: "url", url },
        openLinkInTargetPreference: openTarget ?? openLinkInTargetPreference,
        openLocalUrlInTargetPreference: openTarget ?? openLocalUrlInTargetPreference,
      })
      ? "in-app-browser"
      : "external-browser";
}

/** 自定义协议白名单（原 `qe`）：vscode:/vscode-insiders: 限定 host；mailto/sms/tel。 */
function isAllowedCustomProtocol(url: URL): boolean {
  return url.protocol === "vscode:" || url.protocol === "vscode-insiders:"
    ? url.username.length === 0 && url.password.length === 0 && VSCODE_ALLOWED_HOSTS.has(url.host)
    : EXTERNAL_LINK_PROTOCOLS.has(url.protocol);
}

/** http(s) 判定（原 `Je`/`MH`）。 */
export function isHttpUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/** 本地 file: URL（原 `Ye`）：主机名为空/localhost 且路径为本地路径形态。 */
function isLocalFileUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  if (hostname.length > 0 && hostname !== "localhost") return false;
  const path = normalizeLocalFilePath(url.pathname);
  return isLocalFilePath(path) ? true : !isUncPath(path);
}

function normalizeLocalFilePath(pathname: string): string {
  return normalizePosixPath(platformNormalizePath(pathname).replace(/^\/{3,}/, "//"));
}

/** URL 归一（原 `Ze`）：空/about:blank → 空串；解析失败原样返回。 */
export function normalizeUrlOrBlank(url: string): string {
  const trimmed = url.length === 0 || url === "about:blank" ? "" : url;
  if (trimmed.length === 0) return trimmed;
  try {
    return new URL(trimmed).href;
  } catch {
    return trimmed;
  }
}

// 路由身份常量（原 505-530 行的 `Qe`/`$e`/`et`/`tt`/`nt`/`rt`/`it`）。
export const BROWSER_ROUTE_PARTITION_PREFIX = "persist:codex-browser-app-route:";
export const HOST_GENERATION_SUFFIX = ":host:";
export const THREAD_BROWSER_TABS_PREFIX = "thread-browser-tabs-v1:";
export const PAGE_RESTORE_ATTRIBUTE = "data-browser-sidebar-page-restore";

export function threadBrowserTabKey(threadId: string): string {
  return threadId;
}

export function threadBrowserTabStorageKey(threadId: string): string {
  return `${THREAD_BROWSER_TABS_PREFIX}${encodeURIComponent(threadId)}`;
}

export function browserRoutePartition(ownerKey: string, threadId: string): string {
  return `${BROWSER_ROUTE_PARTITION_PREFIX}${encodeURIComponent(`${ownerKey}\0${threadId}`)}`;
}

// ---------------------------------------------------------------------------
// Slack 原生提升（原 95,590-95,859 的 `lBe`~`bBe`）
// ---------------------------------------------------------------------------

const SLACK_PROTOCOL = "slack://";
const SLACK_ARCHIVES_PATTERN = /^\/archives\/([CDG][A-Z0-9]+)(?:\/p(\d{10})(\d{1,6}))?$/;
const SLACK_THREAD_TS_PATTERN = /^\d{10}\.\d{1,6}$/;
const SLACK_ALLOWED_SEARCH_PARAMS = new Set(["cid", "thread_ts"]);
const slackTeamSchema = objectSchema({ ok: literalSchema(true), team_id: stringSchema().regex(/^[TE][A-Z0-9]+$/) });
const slackTeamCache = new Map<string, string>();

interface SlackArchiveTarget {
  conversationId: string;
  messageTs: string | undefined;
  threadTs: string | undefined;
  workspaceDomain: string;
}

/** 打开偏好（原 `FH`）：设置覆盖或可用性默认。 */
export function resolveOpenLinkPreference(settingsStore: SettingsStoreLike | undefined): string {
  return (
    (settingsStore?.get(openLinkTargetPreference.openLinkInTargetPreference.key) as string | undefined) ??
    (getDesktopFeatureAvailability().defaultLinkOpenTargetPreference as string)
  );
}

/** 打开链接请求（原 `IH` 的 e）。 */
export interface OpenLinkRequest {
  clickModifiers?: string;
  conversationId?: string;
  disposition?: string;
  externalReturnSource?: string;
  hostId?: string;
  initiator?: string;
  openTarget?: string;
  openTargetIntent?: string;
  originHostId?: string;
  presentationIntent?: unknown;
  source?: string;
  url: string;
  useExternalBrowser?: boolean;
}

/** 设置存储面（结构化子集）。 */
export interface SettingsStoreLike {
  get(key: unknown): unknown;
  getEffective(key: unknown): unknown;
}

/** 窗口管理器面（结构化子集）。 */
export interface WindowManagerLike {
  sendInlineMessageForView(webContents: { id: number }, message: Record<string, unknown>): void;
  sendMessageToWebContents(webContents: { id: number }, message: Record<string, unknown>, options?: { priority: string }): void;
}

/** 错误上报面（结构化子集）。 */
export interface ErrorReporterLike {
  reportNonFatal(error: Error, context: { kind: string }): void;
}

/**
 * 打开链接总入口（原 `IH`，95,600-95,753）。
 * 决策顺序：codex deep link → openTarget/修饰键求解 → Slack 原生提升 →
 * in-app-browser inline 消息 → prompt-link-destination（外部返回确认）→
 * shell.openExternal（chatgpt.com 附加 no_universal_links=1）。
 */
export async function openLinkInPreferredTarget({
  request,
  targetWebContents,
  windowManager,
  isDefaultBrowser,
  settingsStore,
  queueCodexDeepLinkUrl,
  getExternalBrowserUrl,
  errorKind,
  errorReporter,
}: {
  request: OpenLinkRequest;
  targetWebContents?: { id: number } | null;
  windowManager: WindowManagerLike;
  isDefaultBrowser?: boolean;
  settingsStore?: SettingsStoreLike;
  queueCodexDeepLinkUrl?(url: string, originHostId?: string): boolean;
  getExternalBrowserUrl?(url: string): Promise<string | null>;
  errorKind?: string;
  errorReporter?: ErrorReporterLike;
}): Promise<boolean> {
  const { url } = request;
  const initiator = request.initiator ?? "open_in_browser_bridge";
  const reportFailure = (error: unknown) => {
    logger().error("Failed to open link", {
      safe: { conversationId: request.conversationId, initiator },
      sensitive: { error, url },
    });
    errorReporter?.reportNonFatal(error instanceof Error ? error : (toError(error) as Error), {
      kind: errorKind ?? "open-link-in-preferred-target",
    });
  };
  const externalShortcutPressed =
    request.openTarget == null &&
    request.useExternalBrowser !== true &&
    isDefaultBrowser !== true &&
    isHttpUrl(url) &&
    request.clickModifiers != null &&
    request.clickModifiers ===
      (settingsStore?.getEffective(openLinkTargetPreference.externalBrowserLinkShortcut.key) ??
        openLinkTargetPreference.externalBrowserLinkShortcut.default);
  const httpsUrl = parseHttpsUrl(url);
  if (
    (httpsUrl == null || (!externalShortcutPressed && request.useExternalBrowser !== true && request.openTarget == null)) &&
    queueCodexDeepLinkUrl?.(url, request.originHostId) === true
  ) {
    return true;
  }
  const availability = getDesktopFeatureAvailability() as { browserPane: boolean };
  const openPreference = resolveOpenLinkPreference(settingsStore);
  const localPreference =
    settingsStore?.getEffective(openLinkTargetPreference.openLocalUrlInTargetPreference.key) ??
    openLinkTargetPreference.openLocalUrlInTargetPreference.default;
  const slackClientUrl = httpsUrl == null ? null : parseSlackClientUrl(httpsUrl);
  const slackArchiveTarget = httpsUrl == null ? null : parseSlackArchiveUrl(httpsUrl);
  const openSlackNative = !externalShortcutPressed && shouldOpenSlackNative(request, httpsUrl, slackClientUrl, slackArchiveTarget);
  const openTarget = resolveLinkOpenTarget({
    browserPaneEnabled: availability.browserPane,
    openLinkInTargetPreference: openPreference,
    openLocalUrlInTargetPreference: localPreference,
    openTarget:
      request.openTarget ??
      (externalShortcutPressed ? "external-browser" : undefined) ??
      (request.disposition === "new-tab" || request.disposition === "new-background-tab" || (isDefaultBrowser === true && isHttpUrl(url))
        ? "in-app-browser"
        : undefined),
    url,
    useExternalBrowser: request.useExternalBrowser,
  });
  if (openSlackNative) {
    if (slackClientUrl != null) {
      try {
        await shell.openExternal(slackClientUrl);
        return true;
      } catch {}
    }
    if (slackArchiveTarget != null && (await openInSlackNative(slackArchiveTarget, initiator, url))) return true;
  }
  if (openTarget === "in-app-browser") {
    if (targetWebContents == null) {
      reportFailure(new Error("In-app browser target requires web contents"));
      return false;
    }
    windowManager.sendInlineMessageForView(targetWebContents, {
      type: "toggle-browser-panel",
      ...(request.disposition === "new-tab" || request.disposition === "new-background-tab"
        ? { browserTabId: `manual:${randomUUID()}` }
        : {}),
      ...(request.disposition === "new-background-tab" ? { active: false } : {}),
      open: true,
      url,
      conversationId: request.conversationId,
      hostId: request.hostId,
      presentationIntent: request.presentationIntent,
      source: request.source ?? "manual",
      initiator,
    });
    return true;
  }
  if (!isSupportedExternalUrl(url)) {
    logger().warning("Invalid link URL", { safe: { initiator }, sensitive: { url } });
    return false;
  }
  const parsed = new URL(url);
  if (
    targetWebContents != null &&
    settingsStore != null &&
    availability.browserPane &&
    openPreference === "external-browser" &&
    request.openTarget == null &&
    request.openTargetIntent === "default" &&
    !externalShortcutPressed &&
    request.useExternalBrowser !== true &&
    !isLocalUrl(url) &&
    (parsed.protocol === "http:" || parsed.protocol === "https:")
  ) {
    windowManager.sendInlineMessageForView(targetWebContents, {
      type: "prompt-link-destination",
      conversationId: request.conversationId,
      disposition: request.disposition,
      externalReturnSource: request.externalReturnSource,
      hostId: request.hostId,
      initiator,
      originHostId: request.originHostId,
      presentationIntent: request.presentationIntent,
      source: request.source ?? "manual",
      url,
    });
    return true;
  }
  try {
    let externalUrl = url;
    if (parsed.protocol === "https:" && parsed.hostname === "chatgpt.com") {
      parsed.searchParams.set("no_universal_links", "1");
      externalUrl = parsed.toString();
    }
    if (!externalShortcutPressed && !openSlackNative && slackArchiveTarget != null && (await openInSlackNative(slackArchiveTarget, initiator, url))) {
      return true;
    }
    const resolved = getExternalBrowserUrl != null && localHttpPort(externalUrl) != null ? await getExternalBrowserUrl(externalUrl) : externalUrl;
    if (resolved == null) return false;
    // ads 外部返回源需要 openId 跟踪开链完成事件（原 `a`）。
    const openId = request.externalReturnSource === "ads" && targetWebContents != null && isHttpUrl(resolved) ? randomUUID() : null;
    if (openId != null && targetWebContents != null) {
      windowManager.sendMessageToWebContents(
        targetWebContents,
        { type: "external-browser-open-started", openId, openedAtMs: Date.now(), url: resolved },
        { priority: "critical" },
      );
    }
    let succeeded = false;
    try {
      await shell.openExternal(resolved);
      succeeded = true;
    } finally {
      if (openId != null && targetWebContents != null) {
        windowManager.sendMessageToWebContents(
          targetWebContents,
          { type: "external-browser-open-finished", openId, succeeded },
          { priority: "critical" },
        );
      }
    }
    return true;
  } catch (error) {
    reportFailure(error);
    return false;
  }
}

/** slack.com/<team>/archives/<channel> 解析（原 `mBe`）。 */
function parseSlackArchiveUrl(url: URL): SlackArchiveTarget | null {
  if (
    url.protocol !== "https:" ||
    url.username !== "" ||
    url.password !== "" ||
    url.port !== "" ||
    url.hash !== "" ||
    !url.hostname.endsWith(".slack.com")
  ) {
    return null;
  }
  const workspaceDomain = url.hostname.slice(0, -10);
  if (workspaceDomain === "" || workspaceDomain === "app" || !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(workspaceDomain)) return null;
  const archives = SLACK_ARCHIVES_PATTERN.exec(url.pathname);
  const conversationId = archives?.[1];
  const messageTsHead = archives?.[2];
  const messageTsTail = archives?.[3];
  if (conversationId == null || (messageTsHead == null && conversationId.startsWith("D"))) return null;
  const messageTs = messageTsHead == null || messageTsTail == null ? undefined : `${messageTsHead}.${messageTsTail}`;
  if (
    [...url.searchParams.keys()].some((key) => !SLACK_ALLOWED_SEARCH_PARAMS.has(key)) ||
    url.searchParams.getAll("cid").length > 1 ||
    url.searchParams.getAll("thread_ts").length > 1
  ) {
    return null;
  }
  const cid = url.searchParams.get("cid");
  const threadTs = url.searchParams.get("thread_ts") ?? undefined;
  return (cid != null && cid !== conversationId) ||
    (cid != null && threadTs == null) ||
    (threadTs != null && (messageTs == null || !SLACK_THREAD_TS_PATTERN.test(threadTs)))
    ? null
    : { conversationId, messageTs, threadTs, workspaceDomain };
}

/** slack:// 深链构造（原 `hBe`）。 */
function buildSlackNativeUrl(target: SlackArchiveTarget, teamId: string): string {
  const params = new URLSearchParams({ team: teamId, id: target.conversationId });
  if (target.messageTs != null) params.set("message", target.messageTs);
  if (target.threadTs != null) params.set("thread_ts", target.threadTs);
  params.set("host", "slack.com");
  return `${SLACK_PROTOCOL}channel?${params.toString()}`;
}

/** 经 slack:// 深链打开（原 `LH`）。 */
async function openInSlackNative(target: SlackArchiveTarget, initiator: string, originalUrl: string): Promise<boolean> {
  const teamId = await resolveSlackTeamId(target.workspaceDomain);
  if (teamId == null) return false;
  try {
    await shell.openExternal(buildSlackNativeUrl(target, teamId));
    return true;
  } catch (error) {
    logger().warning("Failed to open Slack link in Slack", {
      safe: { initiator },
      sensitive: { error, url: originalUrl },
    });
    return false;
  }
}

/** team_id 解析（原 `gBe`）：slack.com/api/auth.findTeam + 3s 超时 + 缓存。 */
async function resolveSlackTeamId(workspaceDomain: string): Promise<string | null> {
  const cached = slackTeamCache.get(workspaceDomain);
  if (cached != null) return cached;
  const endpoint = new URL("https://slack.com/api/auth.findTeam");
  endpoint.searchParams.set("domain", workspaceDomain);
  try {
    const response = await net.fetch(endpoint.toString(), { signal: AbortSignal.timeout(3e3) });
    const parsed = (slackTeamSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: { team_id: string } } }).safeParse(await response.json());
    if (!parsed.success) return null;
    const teamId = parsed.data!.team_id;
    slackTeamCache.set(workspaceDomain, teamId);
    return teamId;
  } catch (error) {
    logger().warning("Failed to resolve Slack workspace", {
      safe: {},
      sensitive: { error, workspaceDomain },
    });
    return null;
  }
}

/** app.slack.com/client/<team>/<channel> → slack:// 深链（原 `_Be`）。 */
function parseSlackClientUrl(url: URL): string | null {
  if (url.hostname !== "app.slack.com" || url.search.length > 0 || url.hash.length > 0) return null;
  const client = url.pathname.match(/^\/client\/(T[A-Z0-9]+)\/([CG][A-Z0-9]+)\/?$/);
  if (client == null) return null;
  const [, teamId, conversationId] = client;
  return `slack://channel?team=${teamId}&id=${conversationId}`;
}

/** Slack 原生提升条件（原 `vBe`）。 */
function shouldOpenSlackNative(
  request: OpenLinkRequest,
  url: URL | null,
  clientUrl: string | null,
  archiveTarget: SlackArchiveTarget | null,
): boolean {
  return request.useExternalBrowser === true || request.openTarget != null || url == null || !isSlackWebPath(url)
    ? false
    : clientUrl != null || archiveTarget != null;
}

/** Slack 站点路径判定（原 `yBe`）。 */
function isSlackWebPath(url: URL): boolean {
  return url.hostname === "app.slack.com"
    ? true
    : url.hostname === "slack.com" || url.hostname === "www.slack.com"
      ? /^\/app_redirect\/?$/.test(url.pathname)
      : url.hostname !== "api.slack.com" &&
        url.hostname.endsWith(".slack.com") &&
        /^\/(?:archives|client|docs|files|messages|team)(?:\/|$)/.test(url.pathname);
}

/** https URL 解析（原 `bBe`）。 */
function parseHttpsUrl(url: string): URL | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed : null;
  } catch {
    return null;
  }
}
