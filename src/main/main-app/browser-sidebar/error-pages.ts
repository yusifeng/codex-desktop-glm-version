// browser sidebar 错误页工厂：加载错误/崩溃错误 → 内嵌 HTML interstitial +
// 图片附件挂起 + 注释/浏览模式切换。
//
// 对应 main-C-Mhak1n.ts 98,523-99,159：
//   - mVe/xU/hVe/SU/gVe/_Ve/CU/vVe：图片附件（session.fetch → dataUrl →
//     browser-sidebar-image-attachment；挂起/中止 WeakMap + 下载暂停）
//   - wU/TU：截图尺寸约束 + about:blank 归一
//   - yVe/EU/DU：注释/浏览快照切换（annotationFlow BATCH 默认）
//   - bVe/xVe/OU：lodash.escape（解码 → 转义）
//   - 消息 id 常量带（contextMenu.* / loadError.* / crashError.*）+ 2 个内嵌
//     base64 图标
//   - MU/wHe/THe：错误页内容构造（加载错误带 4 段建议 + 崩溃错误带外开按钮）
//   - EHe/NU/PU/FU/IU/DHe：错误抑制判定（子框架/-3/ABORTED/BLOCKED_BY_CLIENT/
//     pending navigation）、错误页 URL 匹配（data: 前缀解码）、open-external 协议
//   - OHe：完整 HTML+CSS+JS interstitial 模板（深浅色 + RTL + details 折叠 +
//     reload/外开按钮）
//
// 模块加载期副作用：仅常量。

import {
  xa as isAllowedAttachmentType,
  Sa as isSafeFilename,
  od as unescapeHtml,
  gu as annotationFlows,
} from "@chunk/shared";
import { memoizedTaggedLogger } from "@chunk/logger";

const logger = memoizedTaggedLogger("browser-sidebar-manager");

// ---------------------------------------------------------------------------
// 图片附件（原 `mVe`/`xU`/`hVe`/`SU`/`gVe`/`_Ve`/`CU`/`vVe`）
// ---------------------------------------------------------------------------

interface AttachmentState {
  abort: AbortController;
  pending: number;
  suspension: symbol | null;
}

const attachmentStates = new WeakMap<object, AttachmentState>();

function attachmentStateOf(key: object): AttachmentState {
  let state = attachmentStates.get(key);
  if (state == null) {
    state = { abort: new AbortController(), pending: 0, suspension: null };
    attachmentStates.set(key, state);
  }
  return state;
}

/** 附件下载挂起（原 `mVe`）：中止全部进行中下载，返回恢复句柄。 */
export function suspendImageAttachments(webContents: object): { hadPendingDownloads: boolean; resume(): void } {
  const state = attachmentStateOf(webContents);
  const hadPendingDownloads = state.pending > 0 && !state.abort.signal.aborted;
  const suspension = Symbol();
  state.suspension = suspension;
  state.abort.abort();
  return {
    hadPendingDownloads,
    resume: () => {
      if (attachmentStates.get(webContents) === state && state.suspension === suspension) attachmentStates.delete(webContents);
    },
  };
}

/** webContents 面（结构化子集）。 */
export interface AttachmentWebContentsLike {
  isDestroyed(): boolean;
  once(event: string, listener: () => void): void;
  removeListener(event: string, listener: () => void): void;
  session: { fetch(url: string, init: { referrer?: string; signal: AbortSignal }): Promise<Response> };
}

/** owner webContents 面（结构化子集）。 */
export interface AttachmentOwnerLike {
  isDestroyed(): boolean;
  once(event: string, listener: () => void): void;
  removeListener(event: string, listener: () => void): void;
}

/** 图片附件结果（原 `_Ve` 返回值）。 */
export interface ImageAttachment {
  dataUrl: string;
  filename: string;
}

/** 响应 → 附件（原 `_Ve`）：content-type 白名单 + 空体拒绝。 */
async function responseToImageAttachment(response: Response, sourceUrl: string): Promise<ImageAttachment | null> {
  if (!response.ok) return null;
  const mediaType = response.headers.get("content-type")?.split(";")[0];
  if (mediaType == null || !isAllowedAttachmentType({ name: sourceUrl, type: mediaType })) return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  return bytes.length === 0 ? null : { dataUrl: `data:${mediaType};base64,${bytes.toString("base64")}`, filename: attachmentFilename(sourceUrl, mediaType) };
}

/** 附件文件名（原 `vVe`）：URL 尾段安全名或 browser-image.<ext>。 */
function attachmentFilename(sourceUrl: string, mediaType: string): string {
  try {
    const lastSegment = new URL(sourceUrl).pathname.split("/").at(-1);
    if (lastSegment && isSafeFilename(lastSegment)) return lastSegment;
  } catch {}
  return `browser-image.${mediaType === "image/jpeg" ? "jpg" : mediaType.slice(6)}`;
}

/**
 * 抓取图片并作为附件发送（原 `xU`）：
 * session.fetch（带 referrer）→ dataUrl → browser-sidebar-image-attachment。
 * webContents/owner 销毁或挂起中止时静默放弃。
 */
export async function attachBrowserImage({
  browserTabId,
  browserPageUrl,
  conversationId,
  getCurrentOwner,
  owner,
  sourceUrl,
  webContents,
  windowManager,
}: {
  browserTabId: string;
  browserPageUrl: string;
  conversationId: string;
  getCurrentOwner?(): AttachmentOwnerLike | null;
  owner: AttachmentOwnerLike;
  sourceUrl: string;
  webContents: AttachmentWebContentsLike;
  windowManager: { sendMessageToWebContents(webContents: object, message: unknown): void };
}): Promise<void> {
  if (!URL.canParse(sourceUrl) || webContents.isDestroyed() || owner.isDestroyed()) return;
  const state = attachmentStateOf(webContents);
  if (state.abort.signal.aborted) return;
  state.pending++;
  const abort = () => state.abort.abort();
  webContents.once("destroyed", abort);
  owner.once("destroyed", abort);
  try {
    const response = await webContents.session.fetch(sourceUrl, { referrer: browserPageUrl, signal: state.abort.signal });
    if (state.abort.signal.aborted) return;
    const image = await responseToImageAttachment(response, sourceUrl);
    if (image == null || state.abort.signal.aborted) return;
    const target = getCurrentOwner == null ? owner : getCurrentOwner();
    if (target == null || target.isDestroyed()) return;
    windowManager.sendMessageToWebContents(target, {
      type: "browser-sidebar-image-attachment",
      browserTabId,
      conversationId,
      image,
    });
  } catch (error) {
    if (!state.abort.signal.aborted) {
      logger().warning("Failed to attach browser image to thread", {
        safe: { conversationId },
        sensitive: { error },
      });
    }
  } finally {
    webContents.removeListener("destroyed", abort);
    owner.removeListener("destroyed", abort);
    state.pending--;
    if (state.pending === 0 && state.suspension == null && attachmentStates.get(webContents) === state) attachmentStates.delete(webContents);
  }
}

/** 拖拽项判定（原 `hVe`）：图片内容 + 无链接 + 有 src。 */
export function isImageDragItem(item: { hasImageContents: boolean; linkURL: string; mediaType: string; srcURL: string }): boolean {
  return item.mediaType === "image" && item.hasImageContents && item.linkURL.length === 0 && item.srcURL.length > 0;
}

/** 清除拖拽态（原 `SU`）：归属匹配才清除并广播 inactive。 */
export function clearImageDragState(
  drags: Map<AttachmentOwnerLike, { browserTabId: string; conversationId: string }>,
  browserTabId: string,
  conversationId: string,
  owner: AttachmentOwnerLike,
  windowManager: { sendMessageToWebContents(webContents: object, message: unknown): void },
): void {
  const drag = drags.get(owner) ?? null;
  if (drag?.conversationId === conversationId && drag.browserTabId === browserTabId) {
    drags.delete(owner);
    windowManager.sendMessageToWebContents(owner, {
      type: "browser-sidebar-image-drag-state",
      browserTabId,
      conversationId,
      isActive: false,
    });
  }
}

/** 拖拽释放 → 附件（原 `gVe`）。 */
export async function releaseImageDragAsAttachment(
  drags: Map<AttachmentOwnerLike, { browserTabId: string; conversationId: string; sourceUrl: string }>,
  owner: AttachmentOwnerLike,
  conversationId: string,
  browserTabId: string,
  getTab: () => { conversationId: string; url: string; view: { webContents: AttachmentWebContentsLike | null } } | null,
  windowManager: { sendMessageToWebContents(webContents: object, message: unknown): void },
): Promise<void> {
  const drag = drags.get(owner) ?? null;
  if (drag?.conversationId !== conversationId || drag.browserTabId !== browserTabId) return;
  const tab = getTab();
  const webContents = tab?.view.webContents ?? null;
  if (tab == null || webContents == null || webContents.isDestroyed()) return;
  clearImageDragState(drags, browserTabId, conversationId, owner, windowManager);
  await attachBrowserImage({
    browserTabId,
    browserPageUrl: tab.url,
    conversationId: tab.conversationId,
    owner,
    sourceUrl: drag.sourceUrl,
    webContents,
    windowManager,
  });
}

// ---------------------------------------------------------------------------
// 截图尺寸约束与归一（原 `wU`/`TU`）
// ---------------------------------------------------------------------------

export const SCREENSHOT_SIZE_CONSTRAINTS = { maxHeight: 4096, maxWidth: 4096, minHeight: 160, minWidth: 240 } as const;

/** about:blank → 空串（原 `TU`）。 */
export function blankableUrl(url: string): string {
  return url === "about:blank" ? "" : url;
}

// ---------------------------------------------------------------------------
// 注释/浏览模式切换（原 `yVe`/`EU`/`DU`）
// ---------------------------------------------------------------------------

/** 注释快照（结构化子集）。 */
export interface AnnotationSnapshot {
  annotationFlow?: unknown;
  annotationModeEntrySource?: unknown;
  comments?: Array<{ designChange?: unknown }>;
  interactionMode?: string;
  [key: string]: unknown;
}

/** 注释 tab 状态（结构化子集）。 */
export interface AnnotationTabState {
  isAnnotationModeEnabled: boolean;
  pendingCommentModeActivation?: unknown;
  snapshot: AnnotationSnapshot;
}

/** 最后一条注释是否设计变更（原 `yVe`）。 */
export function hasPendingDesignChange(tab: { snapshot: AnnotationSnapshot }, inCommentMode: boolean): boolean {
  return inCommentMode ? tab.snapshot.comments?.at(-1)?.designChange != null : false;
}

/** 模式切换后的快照（原 `EU`）：注释字段全部复位。 */
export function snapshotForInteractionMode(snapshot: AnnotationSnapshot, mode: "comment" | "browse" | null, comments?: unknown[]): AnnotationSnapshot {
  return {
    ...snapshot,
    ...(mode == null
      ? {}
      : {
          annotationEditorMode: "comment",
          annotationFlow: mode === "comment" ? (snapshot.annotationFlow ?? (annotationFlows as { BATCH: unknown }).BATCH) : (annotationFlows as { BATCH: unknown }).BATCH,
          annotationModeEntrySource: mode === "comment" ? (snapshot.annotationModeEntrySource ?? null) : null,
          interactionMode: mode,
        }),
    comments: comments ?? snapshot.comments,
    isAnnotationAddModifierPressed: false,
    isAnnotationSuspended: false,
    isDesignModifierPressed: false,
    isOriginalViewEnabled: false,
    isTweaksEditorOpen: false,
  };
}

/** 注释模式开关（原 `DU`）：关闭时快照回退 browse，返回是否需要通知。 */
export function setAnnotationModeEnabled(tab: AnnotationTabState, enabled: boolean): boolean {
  return tab.isAnnotationModeEnabled === enabled ||
    ((tab.isAnnotationModeEnabled = enabled), enabled) ||
    ((tab.pendingCommentModeActivation = null), tab.snapshot.interactionMode !== "comment")
    ? false
    : ((tab.snapshot = snapshotForInteractionMode(tab.snapshot, "browse")), true);
}

// ---------------------------------------------------------------------------
// HTML 转义（原 `bVe`/`xVe`/`OU`：lodash.escape 内联实现）
// ---------------------------------------------------------------------------

const HTML_ENTITY_MAP: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const HTML_ENTITY_PATTERN = /[&<>"']/g;
const HTML_ENTITY_TEST = RegExp(HTML_ENTITY_PATTERN.source);

/** HTML 转义（原 `OU`）：先解码再转义，无实体时原样返回。 */
export function escapeHtml(value: string): string {
  const decoded = unescapeHtml(value) as string;
  return decoded && HTML_ENTITY_TEST.test(decoded) ? decoded.replace(HTML_ENTITY_PATTERN, (char) => HTML_ENTITY_MAP[char]) : decoded;
}

// ---------------------------------------------------------------------------
// 消息 id 常量（原 98,688-98,746）
// ---------------------------------------------------------------------------

export const CONTEXT_MENU_MESSAGE_IDS = {
  inspect: "browserSidebar.contextMenu.inspect",
  back: "browserSidebar.contextMenu.back",
  forward: "browserSidebar.contextMenu.forward",
  reload: "browserSidebar.contextMenu.reload",
  openLinkInNewTab: "browserSidebar.contextMenu.openLinkInNewTab",
  openExternalBrowser: "browserSidebar.contextMenu.openExternalBrowser",
  copyLink: "browserSidebar.contextMenu.copyLink",
  commentWithCodex: "browserSidebar.contextMenu.commentWithCodex",
  quickAnnotate: "browserSidebar.contextMenu.quickAnnotate",
  attachImage: "browserSidebar.contextMenu.attachImage",
} as const;

const LOAD_ERROR_HEADING_ID = "browserSidebar.loadError.heading";
const LOAD_ERROR_HEADING_DEFAULT = "This site can't be reached";
const TRY_LABEL_ID = "browserSidebar.loadError.try";
const TRY_LABEL_DEFAULT = "Try:";
const CHECK_CONNECTION_ID = "browserSidebar.loadError.checkConnection";
const CHECK_CONNECTION_DEFAULT = "Checking the connection";
const DETAILS_LINK_LABEL_ID = "browserSidebar.loadError.checkProxyFirewallDns";
const DETAILS_LINK_LABEL_DEFAULT = "Checking the proxy, firewall, and DNS configuration";
const RELOAD_ID = "browserSidebar.loadError.reload";
const RELOAD_DEFAULT = "Reload";
const CRASH_HEADING_ID = "browserSidebar.crashError.heading";
const CRASH_HEADING_DEFAULT = "This page crashed";
const CRASH_SUMMARY_ID = "browserSidebar.crashError.summary";
const CRASH_SUMMARY_DEFAULT = "{host} crashed unexpectedly";
const CRASH_OPEN_EXTERNAL_ID = "browserSidebar.crashError.openExternalBrowser";
const CRASH_OPEN_EXTERNAL_DEFAULT = "Open in external browser";
const SUGGESTION_INTERNET_HEADER_ID = "browserSidebar.loadError.internetHeader";
const SUGGESTION_INTERNET_HEADER_DEFAULT = "Check your Internet connection";
const SUGGESTION_INTERNET_BODY_ID = "browserSidebar.loadError.internetBody";
const SUGGESTION_INTERNET_BODY_DEFAULT = "Check any cables and restart any routers, modems, or other network devices you may be using";
const SUGGESTION_DNS_HEADER_ID = "browserSidebar.loadError.dnsHeader";
const SUGGESTION_DNS_HEADER_DEFAULT = "Check your DNS settings";
const SUGGESTION_DNS_BODY_ID = "browserSidebar.loadError.dnsBody";
const SUGGESTION_DNS_BODY_DEFAULT = "Contact your network administrator if you are not sure what this means";
const SUGGESTION_NETWORK_ACCESS_HEADER_ID = "browserSidebar.loadError.networkAccessHeader";
const SUGGESTION_NETWORK_ACCESS_HEADER_DEFAULT = "Allow {appName} to access the network in your firewall or security settings";
const SUGGESTION_NETWORK_ACCESS_BODY_ID = "browserSidebar.loadError.networkAccessBody";
const SUGGESTION_NETWORK_ACCESS_BODY_DEFAULT = "If {appName} is already listed as an allowed app, try removing it from the list and adding it again";
const SUGGESTION_PROXY_HEADER_ID = "browserSidebar.loadError.proxyHeader";
const SUGGESTION_PROXY_HEADER_DEFAULT = "If you use a proxy server";
const SUGGESTION_PROXY_BODY_ID = "browserSidebar.loadError.proxyBody";
const SUGGESTION_PROXY_BODY_DEFAULT = "Open your system network settings and check whether a proxy has been configured for the active network";

const DATA_HTML_PREFIX = "data:text/html;charset=utf-8,";
const CRASH_ERROR_CODE = "ERR_PROCESS_CRASHED";
const OPEN_EXTERNAL_PROTOCOL = "codex-browser-sidebar://open-external";

// ---------------------------------------------------------------------------
// 错误页构造（原 `MU`/`wHe`/`THe`/`EHe`/`NU`/`PU`/`FU`/`IU`/`DHe`/`OHe`）
// ---------------------------------------------------------------------------

/** i18n 消息。 */
export interface LocalizedMessage {
  messageId: string;
  defaultMessage: string;
  values?: Record<string, string>;
}

type FormatMessage = (message: LocalizedMessage) => string;

/** 错误页记录（原 `MU` 返回值）。 */
export interface LoadErrorPage {
  errorCode: number;
  errorDescription: string;
  failedUrl: string;
  pageUrl: string;
  title: string;
}

/** interstitial 内容（原 `wHe`/`THe` 的 content）。 */
interface InterstitialContent {
  alignActionsEnd: boolean;
  details: Array<{ header: string; body: string }>;
  externalBrowserButton: { actionUrl: string; label: string } | null;
  heading: string;
  language: string;
  reloadButton: string;
  showErrorCode: boolean;
  suggestions: { checkConnection: string; detailsLinkLabel: string; tryLabel: string } | null;
  summary: string;
  textDirection: string;
}

/** runtime intl 配置（结构化子集）。 */
export interface RuntimeIntlConfig {
  defaultLocale?: string;
  locale?: string;
}

/** host 提取（原 `LU`）。 */
function hostOf(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname || parsed.pathname || url;
  } catch {
    return url;
  }
}

/** locale（原 `RU`）。 */
function localeOf(config: RuntimeIntlConfig): string {
  return config.locale || config.defaultLocale || "en-US";
}

/** 文字方向（原 `zU`）。 */
function textDirectionOf(locale: string): "ltr" | "rtl" {
  const parsed = new Intl.Locale(locale.replace(/_/g, "-"));
  return ((Reflect.get(parsed, "textInfo") as { direction?: string } | undefined)?.direction ?? (parsed as unknown as { getTextInfo?: () => { direction: string } }).getTextInfo?.().direction) === "rtl"
    ? "rtl"
    : "ltr";
}

/** 错误码格式化（原 `AHe`）。 */
function formatErrorCode(code: number, message: string): string {
  return message.length > 0 ? message : code === 0 ? "ERR_FAILED" : `ERR_FAILED (${code})`;
}

/** host 大写化（原 `BU`）。 */
function normalizedErrorDescription(description: string): string {
  return description.trim().toUpperCase();
}

/** load error → i18n 消息映射（原 `kHe`）。 */
function loadErrorMessage(errorCode: string): LocalizedMessage {
  switch (errorCode) {
    case "DNS_PROBE_POSSIBLE":
    case "ERR_NAME_NOT_RESOLVED":
      return { messageId: "browserSidebar.loadError.dnsSummary", defaultMessage: "{host}'s server IP address could not be found" };
    case "ERR_INTERNET_DISCONNECTED":
      return { messageId: "browserSidebar.loadError.offlineSummary", defaultMessage: "{host} could not be loaded because the computer is offline" };
    case "ERR_CONNECTION_REFUSED":
      return { messageId: "browserSidebar.loadError.refusedSummary", defaultMessage: "{host} refused to connect" };
    case "ERR_CONNECTION_TIMED_OUT":
    case "ERR_TIMED_OUT":
      return { messageId: "browserSidebar.loadError.timeoutSummary", defaultMessage: "{host} took too long to respond" };
    default:
      return errorCode.startsWith("ERR_CERT_")
        ? { messageId: "browserSidebar.loadError.certificateSummary", defaultMessage: "{host}'s certificate could not be verified" }
        : { messageId: "browserSidebar.loadError.genericSummary", defaultMessage: "{host} could not be loaded" };
  }
}

/** 错误页总装（原 `MU`）：data: URL + encodeURIComponent(HTML)。 */
function buildLoadErrorPage({ content, errorCode, errorDescription, failedUrl }: { content: InterstitialContent; errorCode: number; errorDescription: string; failedUrl: string }): LoadErrorPage {
  const description = normalizedErrorDescription(errorDescription);
  return {
    errorCode,
    errorDescription: description,
    failedUrl,
    pageUrl: DATA_HTML_PREFIX + encodeURIComponent(renderInterstitialHtml({ errorCodeLabel: formatErrorCode(errorCode, description), content, failedUrl })),
    title: content.heading,
  };
}

/** 加载错误内容（原 `wHe`）：4 段建议 + 摘要 + reload。 */
export function buildLoadErrorContent({ errorDescription, failedUrl, formatMessage, runtimeIntlConfig }: { errorDescription: string; failedUrl: string; formatMessage: FormatMessage; runtimeIntlConfig: RuntimeIntlConfig }): InterstitialContent {
  const description = normalizedErrorDescription(errorDescription);
  const host = hostOf(failedUrl);
  const language = localeOf(runtimeIntlConfig);
  return {
    alignActionsEnd: false,
    details: [
      { header: formatMessage({ messageId: SUGGESTION_INTERNET_HEADER_ID, defaultMessage: SUGGESTION_INTERNET_HEADER_DEFAULT }), body: formatMessage({ messageId: SUGGESTION_INTERNET_BODY_ID, defaultMessage: SUGGESTION_INTERNET_BODY_DEFAULT }) },
      { header: formatMessage({ messageId: SUGGESTION_DNS_HEADER_ID, defaultMessage: SUGGESTION_DNS_HEADER_DEFAULT }), body: formatMessage({ messageId: SUGGESTION_DNS_BODY_ID, defaultMessage: SUGGESTION_DNS_BODY_DEFAULT }) },
      { header: formatMessage({ messageId: SUGGESTION_NETWORK_ACCESS_HEADER_ID, defaultMessage: SUGGESTION_NETWORK_ACCESS_HEADER_DEFAULT, values: { appName: "ChatGPT" } }), body: formatMessage({ messageId: SUGGESTION_NETWORK_ACCESS_BODY_ID, defaultMessage: SUGGESTION_NETWORK_ACCESS_BODY_DEFAULT, values: { appName: "ChatGPT" } }) },
      { header: formatMessage({ messageId: SUGGESTION_PROXY_HEADER_ID, defaultMessage: SUGGESTION_PROXY_HEADER_DEFAULT }), body: formatMessage({ messageId: SUGGESTION_PROXY_BODY_ID, defaultMessage: SUGGESTION_PROXY_BODY_DEFAULT }) },
    ],
    externalBrowserButton: null,
    heading: formatMessage({ messageId: LOAD_ERROR_HEADING_ID, defaultMessage: LOAD_ERROR_HEADING_DEFAULT }),
    language,
    reloadButton: formatMessage({ messageId: RELOAD_ID, defaultMessage: RELOAD_DEFAULT }),
    showErrorCode: true,
    suggestions: {
      checkConnection: formatMessage({ messageId: CHECK_CONNECTION_ID, defaultMessage: CHECK_CONNECTION_DEFAULT }),
      detailsLinkLabel: formatMessage({ messageId: DETAILS_LINK_LABEL_ID, defaultMessage: DETAILS_LINK_LABEL_DEFAULT }),
      tryLabel: formatMessage({ messageId: TRY_LABEL_ID, defaultMessage: TRY_LABEL_DEFAULT }),
    },
    summary: formatMessage({ ...loadErrorMessage(description), values: { host } }),
    textDirection: textDirectionOf(language),
  };
}

/** 崩溃错误页（原 `THe`）：外开按钮（https/本地 http 且非默认浏览器时）。 */
export function buildCrashErrorPage({ failedUrl, formatMessage, isDefaultBrowser, runtimeIntlConfig, isSecureOrLocalHttp }: { failedUrl: string; formatMessage: FormatMessage; isDefaultBrowser: boolean; runtimeIntlConfig: RuntimeIntlConfig; isSecureOrLocalHttp(url: string): boolean }): LoadErrorPage {
  const host = hostOf(failedUrl);
  const language = localeOf(runtimeIntlConfig);
  return buildLoadErrorPage({
    content: {
      alignActionsEnd: true,
      details: [],
      externalBrowserButton:
        !isDefaultBrowser && isSecureOrLocalHttp(failedUrl)
          ? { actionUrl: `${OPEN_EXTERNAL_PROTOCOL}?url=${encodeURIComponent(failedUrl)}`, label: formatMessage({ messageId: CRASH_OPEN_EXTERNAL_ID, defaultMessage: CRASH_OPEN_EXTERNAL_DEFAULT }) }
          : null,
      heading: formatMessage({ messageId: CRASH_HEADING_ID, defaultMessage: CRASH_HEADING_DEFAULT }),
      language,
      reloadButton: formatMessage({ messageId: RELOAD_ID, defaultMessage: RELOAD_DEFAULT }),
      showErrorCode: false,
      suggestions: null,
      summary: formatMessage({ messageId: CRASH_SUMMARY_ID, defaultMessage: CRASH_SUMMARY_DEFAULT, values: { host } }),
      textDirection: textDirectionOf(language),
    },
    errorCode: 0,
    errorDescription: CRASH_ERROR_CODE,
    failedUrl,
  });
}

/** 错误抑制判定（原 `EHe`）：子框架/-3/ABORTED/BLOCKED_BY_CLIENT 不出错误页。 */
export function shouldSuppressLoadError({ errorCode, errorDescription, isMainFrame }: { errorCode: number; errorDescription: string; isMainFrame: boolean }): boolean {
  const description = normalizedErrorDescription(errorDescription);
  return !isMainFrame || errorCode === -3 || description === "ERR_ABORTED" || description === "ERR_BLOCKED_BY_CLIENT";
}

/** 中止型导航错误（原 `NU`）。 */
export function isAbortedNavigationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (/ERR_ABORTED|\(-3\) loading '/.test(error.message) || error.message === "Navigation failed with error code -3.")
  );
}

/** pending navigation 错误（原 `PU`）。 */
export function isPendingNavigationError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("navigation is already pending");
}

/** 错误页 URL 的原始失败地址（原 `IU`）：data: 前缀解码。 */
export function errorPageFailedUrl(url: string): string | null {
  const [withoutHash] = url.split("#", 1);
  if (!withoutHash.startsWith(DATA_HTML_PREFIX)) return null;
  const encoded = withoutHash.slice(29);
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

/** 错误页匹配（原 `FU`）。 */
export function matchesLoadError(error: { pageUrl: string } | null, url: string): boolean {
  if (error == null) return false;
  if (url === error.pageUrl) return true;
  const urlFailed = errorPageFailedUrl(url);
  const errorFailed = errorPageFailedUrl(error.pageUrl);
  return urlFailed != null && errorFailed != null && urlFailed === errorFailed;
}

/** open-external 协议解析（原 `DHe`）。 */
export function openExternalActionUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol !== "codex-browser-sidebar:" || parsed.hostname !== "open-external" ? null : parsed.searchParams.get("url");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// interstitial HTML 模板（原 `OHe` + `SHe`/`CHe` 图标）
// ---------------------------------------------------------------------------

const ICON_1X = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAcCAYAAAB/E6/TAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAOPSURBVHgBpVZdUhpBEO6eXQ1v4QZZTyCW+pz1BOIJAg+pEitVkhMIJwBe1DfwBJoTuHkVKfAEIScIeQu4O52enZ3dWViUmK4Cdufv66/76x4Q/tWa4/LW4tmTQnhR6Ezgem+6yTZ3k0VbZw+VCJxjAqrCPKqEIAAiAMRoQgB7m5zxMtDp2OPD+iGBD0AFC7AMG9paIHE2uiCKWkvDM/4EzOw7kJhBSdzBhoYrI5wDnEe3/ORbowERtaHkTqC7N4M3mLsCsoju+amSjMzY+zZcHXbhPy0HJBayQ2RAcEokjtapqtQce2EYeihp9ry9NX2NaRo653RUk0j9l0DcL0M/ivACNOPy0kkTAdiLtjlvBaAaKFaX5JCRp16JnJ0cSHHe1vk+FQjt6HJ/kHNSfQkMqwToaRDOiQ2inJgrJ8Cz9gWI8MSrZ3oP7vJPVU+RJwn6rNoP8nK/nQMiEOe6TnAKJSeXeBTMhAyICqmsw/VhsFJV7BBAWEOMQ6scbonG8LdMhIRJ3O/jF8QBe1E3e3N54xzQtnP0qrx5D6a5ZtWSs6ciJGSUShmklDf2Hino3DyTdE5sENWWlJOaiWXX+wMuia/JW1l1FvUggDBbWHKn6TMLAIzUib7ZeeP4c1sSYxUJPuiHaIw68XpjOlxB8uarOVakJdNudpgbhilTTnxgO83xr+begZpiLi/sMQR2zjg2D2sC1lgoaW0uWAh1Bu/pELGAEjCblSQ364OIHocOsgObVrxVtacH43EO6ergTl4eNFWIBEEqYfiTRSFf7PieQ0fpgLOQfjqnEx8kb5z0oQ9F7AR8hA1M2BQlUc7zuHiNT4i3ztmoZs87jccqr0nGOIRcX+kkqzJbKX+KhKJZUM3JVRVmBlZmR/rYePzFn3v1KwFuU6dA9nIMCP2MAE6E9hxvMs+jjr2BwVo2M9DN1AerqcbzS1eJ7jYJU86pVh0Xmap8w4pbR3MVzNlRStPsldJwGiuP6EjN59jw7WwatCmN7Ib9/FBBV4xTZixd+YYLT/8FoJZhY66b/FXOTBCwk4FhV5LobfSXSlU/F21cT4lxvZ2osOmzlu102DId2HjF9AdSiptCQAWwkOfMQgFYecN6nJLU6SJj2WpmOs42KI8xsAoJ8aFYWV2jOjad5KS+FihmZu4X8angsCJTAD1uzN31V/lrxneMQPIJYTe5BJMQxWENJMkneOcOXrqr/gLOd9dS8TJZjQAAAABJRU5ErkJggg==`;
const ICON_2X = `data:image/png;base64,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`;

/** JSON 内嵌转义（原 `VU`）。 */
function jsonForEmbedding(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003C")
    .replace(/>/g, "\\u003E")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** interstitial HTML 渲染（原 `OHe`）。 */
function renderInterstitialHtml({ content, errorCodeLabel, failedUrl }: { content: InterstitialContent; errorCodeLabel: string; failedUrl: string }): string {
  const details = content.details
    .map(
      (detail) => `      <div class="suggestions">
        <div class="suggestion-header">${escapeHtml(detail.header)}</div>
        <div class="suggestion-body">${escapeHtml(detail.body)}</div>
      </div>`,
    )
    .join("\n");
  const detailsLink =
    content.suggestions?.detailsLinkLabel == null
      ? ""
      : `            <li><a id="details-link" href="#details" aria-expanded="false">${escapeHtml(content.suggestions.detailsLinkLabel)}</a></li>`;
  const externalButton =
    content.externalBrowserButton == null
      ? ""
      : `      <button id="open-in-browser-button" type="button">${escapeHtml(content.externalBrowserButton.label)}</button>`;
  const navWrapperClass = content.alignActionsEnd ? "nav-wrapper nav-wrapper-end" : "nav-wrapper";
  const errorCodeHtml = content.showErrorCode ? `        <div class="error-code">${escapeHtml(errorCodeLabel)}</div>` : "";
  const suggestions =
    content.suggestions == null
      ? ""
      : `        <div id="suggestions-list">
          <p>${escapeHtml(content.suggestions.tryLabel)}</p>
          <ul>
            <li>${escapeHtml(content.suggestions.checkConnection)}</li>
${detailsLink}
          </ul>
        </div>`;
  return `<!DOCTYPE html>
<html dir="${escapeHtml(content.textDirection)}" lang="${escapeHtml(content.language)}">
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" content="#fff">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${escapeHtml(content.heading)}</title>
  <style>
    body {
      --background-color: #fff;
      --error-code-color: rgb(95, 99, 104);
      --google-blue-300: rgb(138, 180, 248);
      --google-gray-300: rgb(218, 220, 224);
      --google-gray-500: rgb(154, 160, 166);
      --google-gray-700: rgb(95, 99, 104);
      --google-gray-900: rgb(32, 33, 36);
      --heading-color: var(--google-gray-900);
      --link-color: rgb(88, 88, 88);
      --button-fill-color: rgb(26 28 31 / 5%);
      --button-fill-color-active: rgb(26 28 31 / 10%);
      --button-text-color: #1a1c1f;
      --text-color: var(--google-gray-700);
      background: var(--background-color);
      color: var(--text-color);
      font-family: system-ui, sans-serif;
      font-size: 70%;
      margin: 0;
      overflow-wrap: break-word;
    }

    @media (prefers-color-scheme: dark) {
      body {
        --background-color: var(--google-gray-900);
        --error-code-color: var(--google-gray-500);
        --heading-color: var(--google-gray-500);
        --link-color: var(--google-blue-300);
        --button-fill-color: rgb(255 255 255 / 5%);
        --button-fill-color-active: rgb(255 255 255 / 10%);
        --button-text-color: #fff;
        --text-color: var(--google-gray-500);
      }
    }

    html {
      -webkit-text-size-adjust: 100%;
      font-size: 125%;
    }

    a {
      color: var(--link-color);
      text-decoration: none;
    }

    button {
      align-items: center;
      background: var(--button-fill-color);
      border: 1px solid transparent;
      border-radius: 8px;
      box-sizing: border-box;
      color: var(--button-text-color);
      cursor: pointer;
      display: inline-flex;
      font-family: inherit;
      font-size: 13px;
      font-weight: 500;
      justify-content: center;
      line-height: 18px;
      margin: 0;
      min-height: 28px;
      padding: 0 8px;
      user-select: none;
      white-space: nowrap;
    }

    button:active {
      background: var(--button-fill-color-active);
      outline: 0;
    }

    button:hover {
      background: var(--button-fill-color-active);
      outline: 0;
    }

    .interstitial-wrapper {
      box-sizing: border-box;
      font-size: 1em;
      line-height: 1.6em;
      margin: 20vh auto 0;
      max-width: 600px;
      width: 100%;
    }

    .icon {
      -webkit-user-select: none;
      animation: icon-spin 3s linear infinite;
      background-image: image-set(url("${ICON_1X}") 1x, url("${ICON_2X}") 2x);
      background-repeat: no-repeat;
      background-size: 26px 28px;
      display: inline-block;
      height: 28px;
      margin: 0 0 24px;
      transform-origin: 50% 50%;
      width: 26px;
    }

    @keyframes icon-spin {
      100% {
        transform: rotate(360deg);
      }
    }

    h1 {
      color: var(--heading-color);
      font-size: 1.2em;
      font-weight: 500;
      line-height: 1.2em;
      margin: 0 0 12px;
    }

    #main-message > p {
      display: inline;
      font-size: 1em;
    }

    #suggestions-list {
      margin-top: 18px;
    }

    #suggestions-list p {
      margin-block-end: 0;
    }

    #suggestions-list ul {
      margin-top: 0;
    }

    .error-code {
      color: var(--error-code-color);
      font-size: .8em;
      margin-top: 24px;
      text-transform: uppercase;
    }

    .nav-wrapper {
      display: flex;
      gap: 8px;
      justify-content: flex-start;
      margin-top: 51px;
    }

    [dir="rtl"] .nav-wrapper {
      justify-content: flex-end;
    }

    .nav-wrapper-end {
      justify-content: flex-end;
    }

    #details {
      display: none;
      margin: 0 0 50px;
    }

    #main-frame-error.showing-details #details {
      display: block;
    }

    .suggestions {
      margin-top: 18px;
    }

    .suggestion-header {
      font-weight: bold;
      margin-bottom: 4px;
    }

    .suggestion-body {
      color: #777;
    }

    @media (prefers-color-scheme: dark) {
      .icon {
        filter: brightness(1.2);
      }

      .suggestion-body {
        color: var(--text-color);
      }
    }

    @media (max-width: 700px) {
      .interstitial-wrapper {
        padding: 0 10%;
      }
    }

    @media (max-width: 420px) {
      .interstitial-wrapper {
        margin: 7vh auto 12px;
        padding: 0 24px;
      }

      .nav-wrapper {
        margin-top: 30px;
      }

      #details {
        margin: 20px 0;
      }

      h1 {
        font-size: 1.5em;
        margin-bottom: 8px;
      }
    }
  </style>
</head>
<body class="neterror">
  <div id="main-frame-error" class="interstitial-wrapper">
    <div id="main-content">
      <div class="icon" aria-hidden="true"></div>
      <div id="main-message">
        <h1>${escapeHtml(content.heading)}</h1>
        <p>${escapeHtml(content.summary)}</p>
${suggestions}
${errorCodeHtml}
      </div>
    </div>
    <div id="buttons" class="${navWrapperClass}">
${externalButton}
      <button id="reload-button" type="button">${escapeHtml(content.reloadButton)}</button>
    </div>
    <div id="details">
${details}
    </div>
  </div>
  <script>
    (() => {
      const failedUrl = ${jsonForEmbedding(failedUrl)};
      const externalBrowserActionUrl = ${jsonForEmbedding(content.externalBrowserButton?.actionUrl ?? "")};
      const main = document.getElementById("main-frame-error");
      const details = document.getElementById("details");
      const detailsLink = document.getElementById("details-link");
      const openInBrowserButton = document.getElementById("open-in-browser-button");
      const reloadButton = document.getElementById("reload-button");
      const setDetailsVisible = (visible) => {
        main.classList.toggle("showing-details", visible);
        detailsLink?.setAttribute("aria-expanded", String(visible));
        if (visible) {
          details.setAttribute("tabindex", "-1");
          details.focus();
        }
      };
      detailsLink?.addEventListener("click", (event) => {
        event.preventDefault();
        setDetailsVisible(!main.classList.contains("showing-details"));
      });
      reloadButton.addEventListener("click", () => {
        window.location.href = failedUrl;
      });
      openInBrowserButton?.addEventListener("click", () => {
        window.location.href = externalBrowserActionUrl;
      });
    })();
  <\/script>
</body>
</html>`;
}
