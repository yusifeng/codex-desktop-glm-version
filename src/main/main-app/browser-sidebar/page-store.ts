// browser sidebar 页面状态与持久化 store：页面 schema + 导航序列化 + 字节预算
// + 磁盘落盘 + 窗口关闭前保存门面。
//
// 对应 main-C-Mhak1n.ts 99,161-99,460（导航/序列化工具）与 99,464-99,791（store）：
//   - LU/RU/zU/AHe/BU/VU：错误页辅助（host 提取、locale、方向、错误码格式化、
//     JSON 内嵌转义）
//   - kHe + 消息 id 常量：load error → i18n 消息映射（dns/offline/refused/
//     timeout/cert/generic 六类）
//   - jHe/HU/MHe/WU/NHe/GU/PHe：1s 超时、attach-token 前缀、默认 viewport env、
//     双窗口消息、CDP 颜色同步（Emulation.setEmulatedMedia）、设备尺寸覆写
//   - KU/qU/JU/YU/XU/ZU/QU/$U/FU/IU：页面键、i18n、URL 归一/分类、错误页匹配
//   - eW/tW/nW/FHe/rW/IHe/oW/sW/cW：页面状态构造与序列化（navigationHistory
//     优先；attach-token 条目剥离；错误页 URL 替换）
//   - iW/aW/LHe/lW：尺寸钳制、鼠标转发、注释快照
//   - uW/UHe/WHe schema + GHe store（entries Map + maxBytes 64MiB/maxPages 100 +
//     dW 字节预算（JSON 转义感知）+ qHe 读取 + JHe 原子写盘）
//   - YHe 门面（enablePersistence/reassociate/deleteOwned/persistCurrent/
//     persistWindowBeforeShutdown/registerWindowShutdown）+ ZHe 冷恢复/热序列化
//
// 模块加载期副作用：仅 logger。

import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { screen } from "electron";
import {
  wf as objectSchema,
  Of as stringSchema,
  Cf as numberSchema,
  bf as literalSchema,
  hf as arraySchema,
  Ef as recordSchema,
  Mf as jsonSchema,
} from "@chunk/shared";
import { memoizedTaggedLogger } from "@chunk/logger";
import { bn as browserTabIdOf, hn as intlFormatter } from "@chunk/bootstrap";
import { matchesLoadError } from "./error-pages";

const logger = memoizedTaggedLogger("browser-sidebar-page-store");
const managerLogger = memoizedTaggedLogger("browser-sidebar-manager");

// ---------------------------------------------------------------------------
// 常量与错误页辅助（原 `jHe`/`HU`/`MHe` + `LU`/`RU`/`zU`/`AHe`/`BU`/`VU`/`kHe`）
// ---------------------------------------------------------------------------

const DEBUGGER_COMMAND_TIMEOUT_MS = 1e3;
const ATTACH_TOKEN_URL_PREFIX = "about:blank#codex-browser-sidebar-attach-token=";
const DEFAULT_VIEWPORT_SIZE_ENV = "CODEX_BROWSER_USE_DEFAULT_VIEWPORT_SIZE";
const MAX_NAVIGATION_ENTRIES = 500;
const PERSISTENCE_MAX_BYTES = 67_108_864;
const PERSISTENCE_MAX_PAGES = 100;
const PERSISTENCE_FILENAME = "browser-sidebar-page-states.json";

/** host 提取（原 `LU`）：URL 解析失败原样返回。 */
function hostOf(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname || parsed.pathname || url;
  } catch {
    return url;
  }
}

/** locale（原 `RU`）。 */
function localeOf(webContents: { locale: string; defaultLocale: string }): string {
  return webContents.locale || webContents.defaultLocale || "en-US";
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
function normalizedHost(url: string): string {
  return hostOf(url).trim().toUpperCase();
}

/** JSON 内嵌转义（原 `VU`）：HTML 安全。 */
function jsonForEmbedding(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003C")
    .replace(/>/g, "\\u003E")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** load error → i18n 消息映射（原 `kHe`）。 */
function loadErrorMessage(errorCode: string): { messageId: string; defaultMessage: string } {
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

/** i18n 格式化（原 `JU`/`RHe`）：异常时回退 {placeholder} 替换。 */
export function formatMessage(message: { defaultMessage: string; values?: Record<string, string> }): string {
  try {
    return (intlFormatter() as { formatMessage(input: { defaultMessage: string; values?: Record<string, string> }): string }).formatMessage(message);
  } catch {
    return message.defaultMessage.replace(/\{(\w+)\}/g, (_match, key: string) => message.values?.[key] ?? _match);
  }
}

// ---------------------------------------------------------------------------
// URL/键工具（原 `KU`/`qU`/`YU`/`XU`/`ZU`/`QU`/`FU`/`IU`/`iW`/`aW`）
// ---------------------------------------------------------------------------

/** 页面键（原 `KU`）。 */
export function pageKey(webContentsId: number, conversationId: string, browserTabId: string): string {
  return `${webContentsId}:${conversationId}:${browserTabId}`;
}

/** 会话+tab 复合键（原 `qU`）。 */
export function conversationTabKey({ browserTabId, conversationId }: { browserTabId: string; conversationId: string }): string {
  return `${conversationId}\0${browserTabId}`;
}

/** about:blank → 空串（原 `YU`）。 */
export function blankableUrl(url: string): string {
  return url === "about:blank" ? "" : url;
}

/** 跨源判定（原 `XU`）：任一为空视为跨页；file: 按 href 全量比较。 */
export function isCrossOriginNavigation(currentUrl: string, nextUrl: string): boolean {
  const current = blankableUrl(currentUrl);
  const next = blankableUrl(nextUrl);
  if (current.length === 0 || next.length === 0) return true;
  try {
    const currentParsed = new URL(current);
    const nextParsed = new URL(next);
    return currentParsed.protocol === "file:" || nextParsed.protocol === "file:"
      ? currentParsed.href !== nextParsed.href
      : currentParsed.origin !== nextParsed.origin;
  } catch {
    return current !== next;
  }
}

/** URL 分类（原 `ZU`）：file_html/local_http/remote_http/unknown。 */
export function urlKind(url: string): "file_html" | "local_http" | "remote_http" | "unknown" {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "file:"
      ? "file_html"
      : parsed.protocol !== "http:" && parsed.protocol !== "https:"
        ? "unknown"
        : parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "[::1]" || parsed.hostname === "::1"
          ? "local_http"
          : "remote_http";
  } catch {
    return "unknown";
  }
}

/** 待导航 URL 优先（原 `QU`）。 */
export function effectiveUrl(page: { pendingUrl: string; url: string }): string {
  return page.pendingUrl.length > 0 && page.pendingUrl !== page.url ? page.pendingUrl : page.url;
}

/** 查找 URL 对应的错误页（原 `$U`）：data: URL 按 hash 匹配。 */
function findLoadError(page: Pick<BrowserTabViewLike, "errorPagesByUrl" | "loadError">, url: string): LoadErrorRecord | null {
  if (matchesLoadError(page.loadError, url)) return page.loadError;
  const exact = page.errorPagesByUrl.get(url);
  if (exact != null || !url.startsWith("data:")) return exact ?? null;
  for (const error of page.errorPagesByUrl.values()) if (matchesLoadError(error, url)) return error;
  return null;
}

/** 数值钳制（原 `iW`）。 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** ≥1 向上取整（原 `aW`）。 */
function atLeastOne(value: number): number {
  return Math.max(1, Math.ceil(value));
}

// ---------------------------------------------------------------------------
// 页面状态构造与序列化（原 `$U`/`eW`/`tW`/`nW`/`FHe`/`rW`/`IHe`/`oW`/`sW`/`cW`）
// ---------------------------------------------------------------------------

/** 导航条目。 */
export interface NavigationEntry {
  pageState?: string;
  title: string;
  url: string;
}

/** 页面状态（uW schema 的运行时形态）。 */
export interface PageState {
  faviconUrl: string | null;
  navigation: { currentIndex: number | null; entries: NavigationEntry[] };
  runtime: "electron-webview";
  title: string;
  updatedAt: number;
  url: string;
}

/** 加载错误记录（结构化子集）。 */
export interface LoadErrorRecord {
  failedUrl: string;
  pageUrl: string;
  title: string;
}

/** 可序列化的 tab 视图（结构化子集；实现见 R8 IAB manager）。 */
export interface BrowserTabViewLike {
  browserStorageId: string;
  browserTabId: string;
  conversationId: string;
  errorPagesByUrl: Map<string, LoadErrorRecord>;
  fallbackTitle: string;
  faviconUrl: string | null;
  isColdRestore?: boolean;
  loadError: LoadErrorRecord | null;
  pendingUrl: string;
  serializedPageState: PageState | null;
  title: string;
  url: string;
  view: { webContents: ElectronWebContentsLike | null };
}

/** webContents 面（结构化子集）。 */
export interface ElectronWebContentsLike {
  id: number;
  isDestroyed(): boolean;
  isLoading(): boolean;
  getURL(): string;
  navigationHistory: {
    getAllEntries(): Array<{ pageState?: string; title: string; url: string }>;
    getActiveIndex(): number;
  } | null;
}

/** 单条目导航（原 `oW`）。 */
function singleEntryNavigation(title: string, url: string): { currentIndex: number | null; entries: NavigationEntry[] } {
  return url.length === 0 ? { currentIndex: null, entries: [] } : { currentIndex: 0, entries: [{ title, url }] };
}

/** 从 webContents 构造导航（原 `IHe`）：navigationHistory 优先，错误页 URL 替换。 */
function navigationFromWebContents(page: Pick<BrowserTabViewLike, "errorPagesByUrl" | "loadError">, title: string, url: string, webContents: ElectronWebContentsLike): { currentIndex: number | null; entries: NavigationEntry[] } {
  const history = webContents.navigationHistory;
  if (
    url.length > 0 &&
    !webContents.isDestroyed() &&
    !webContents.isLoading() &&
    history != null &&
    typeof history.getAllEntries === "function" &&
    typeof history.getActiveIndex === "function"
  ) {
    const entries = history.getAllEntries().map((entry) => {
      const error = findLoadError(page, entry.url);
      return error == null ? { pageState: entry.pageState, title: entry.title, url: entry.url } : { title: error.title, url: error.failedUrl };
    });
    if (entries.length > 0) return { currentIndex: history.getActiveIndex(), entries };
  }
  return singleEntryNavigation(title, url);
}

/** 全新页面状态（原 `eW`）。 */
export function freshPageState({ faviconUrl, title, url }: { faviconUrl: string | null; title: string; url: string }): PageState {
  return { runtime: "electron-webview", faviconUrl, navigation: singleEntryNavigation(title, url), title, updatedAt: Date.now(), url };
}

/** 从存活 webContents 构造页面状态（原 `tW`）。 */
export function pageStateFromWebContents({ pageState, title, url, webContents }: { pageState: Pick<BrowserTabViewLike, "errorPagesByUrl" | "loadError" | "faviconUrl">; title: string; url: string; webContents: ElectronWebContentsLike }): PageState {
  return {
    runtime: "electron-webview",
    faviconUrl: pageState.faviconUrl,
    navigation: navigationFromWebContents(pageState, title, url, webContents),
    title,
    updatedAt: Date.now(),
    url,
  };
}

/** 可持久化导航提取（原 `nW`）：空/单条无 pageState → null。 */
function persistableNavigationOf(page: PageState | null): PageState["navigation"] | null {
  const navigation = page?.navigation ?? null;
  if (navigation == null || navigation.entries.length === 0) return null;
  const index = navigation.currentIndex;
  return index == null || index < 0 || index >= navigation.entries.length
    ? null
    : navigation.entries.length > 1 || index !== 0 || navigation.entries.some((entry) => entry.pageState != null)
      ? navigation
      : null;
}

/** attach-token 条目剥离（原 `rW`）：当前条目为 token 页 → null。 */
export function stripAttachTokenEntries(page: PageState | null): PageState | null {
  if (page == null) return null;
  const { navigation } = page;
  const { currentIndex } = navigation;
  if (currentIndex == null || currentIndex < 0 || currentIndex >= navigation.entries.length) return null;
  const currentUrl = navigation.entries[currentIndex]?.url ?? "";
  if (currentUrl.length === 0 || currentUrl.startsWith(ATTACH_TOKEN_URL_PREFIX)) return null;
  const entries: NavigationEntry[] = [];
  let adjustedIndex = currentIndex;
  for (const [index, entry] of navigation.entries.entries()) {
    if (entry.url.startsWith(ATTACH_TOKEN_URL_PREFIX)) {
      if (index < currentIndex) --adjustedIndex;
      continue;
    }
    entries.push(entry);
  }
  return { ...page, navigation: { ...navigation, currentIndex: adjustedIndex, entries } };
}

/** 校验后的导航提取（原 `FHe`）。 */
export function validatedNavigationOf(page: PageState | null): PageState["navigation"] | null {
  return stripAttachTokenEntries(page)?.navigation ?? null;
}

/** 导航版本推进（原 `sW`）。 */
export function bumpNavigationVersion(page: { managedNavigation?: unknown; navigationVersion: number }): void {
  page.navigationVersion += 1;
  page.managedNavigation = undefined;
}

/** 快照 URL 或当前有效 URL（原 `cW`）。 */
export function currentUrlOf(tab: { page: BrowserTabViewLike | null; snapshot: { url: string } }): string {
  return tab.page == null ? tab.snapshot.url : effectiveUrl(tab.page);
}

// ---------------------------------------------------------------------------
// CDP 视口/颜色同步（原 `NHe`/`GU`/`PHe`）与消息/鼠标工具（原 `WU`/`LHe`/`lW`）
// ---------------------------------------------------------------------------

/** 默认视口尺寸 env（原 `NHe`）：`<width>x<height>`。 */
export function defaultViewportSize(): { width: number; height: number } | null {
  const raw = process.env[DEFAULT_VIEWPORT_SIZE_ENV]?.trim();
  const match = /^(?<width>\d+)x(?<height>\d+)$/u.exec(raw ?? "");
  return match?.groups == null ? null : { width: Number.parseInt(match.groups.width, 10), height: Number.parseInt(match.groups.height, 10) };
}

/** CDP 颜色同步（原 `GU`）：setEmulatedMedia prefers-color-scheme，1s 超时。 */
export async function syncColorScheme(webContents: { debugger: DebuggerLike; id: number }, scheme: string): Promise<void> {
  const wasAttached = webContents.debugger.isAttached();
  let timeout: NodeJS.Timeout | null = null;
  try {
    if (!wasAttached) webContents.debugger.attach("1.3");
    await Promise.race([
      webContents.debugger.sendCommand("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] }),
      new Promise((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error("Timed out syncing browser page color scheme")), DEBUGGER_COMMAND_TIMEOUT_MS);
        timeout.unref();
      }),
    ]);
  } catch (error) {
    managerLogger().warning("failed to sync browser page color scheme", {
      safe: { webContentsId: webContents.id },
      sensitive: { error },
    });
  } finally {
    if (timeout != null) clearTimeout(timeout);
    if (!wasAttached && webContents.debugger.isAttached()) {
      try {
        webContents.debugger.detach();
      } catch (error) {
        managerLogger().warning("failed to detach browser page debugger", {
          safe: { webContentsId: webContents.id },
          sensitive: { error },
        });
      }
    }
  }
}

/** debugger 面（结构化子集）。 */
export interface DebuggerLike {
  isAttached(): boolean;
  attach(version: string): void;
  detach(): void;
  sendCommand(method: string, params?: unknown): Promise<unknown>;
}

/** CDP 设备尺寸覆写（原 `PHe`）：null → clearDeviceMetricsOverride。 */
export async function syncDeviceMetrics(tab: { conversationId: string; view: { webContents: (ElectronWebContentsLike & { debugger: DebuggerLike }) | null } }, size: { width: number; height: number } | null): Promise<void> {
  const webContents = tab.view.webContents;
  if (webContents == null || webContents.isDestroyed()) return;
  const debugger_ = webContents.debugger;
  let attachedHere = false;
  try {
    if (!debugger_.isAttached()) {
      debugger_.attach("1.3");
      attachedHere = true;
    }
    if (size == null) {
      await debugger_.sendCommand("Emulation.clearDeviceMetricsOverride");
      return;
    }
    await debugger_.sendCommand("Emulation.setDeviceMetricsOverride", {
      deviceScaleFactor: 1,
      height: Math.round(size.height),
      mobile: false,
      width: Math.round(size.width),
    });
  } catch (error) {
    managerLogger().warning("failed to sync browser sidebar device metrics", {
      safe: { conversationId: tab.conversationId },
      sensitive: { error },
    });
  } finally {
    if (attachedHere && !webContents.isDestroyed() && debugger_.isAttached()) debugger_.detach();
  }
}

/** 双窗口消息发送（原 `WU`）：tab 源窗口 + 当前 owner。 */
export function sendToTabWindows(
  windowManager: { sendMessageToWebContents(webContents: { id: number }, message: unknown): void },
  tab: { owner: { id: number }; tabSourceWindow: { owner: { id: number } } | null },
  message: unknown,
): void {
  if (tab.tabSourceWindow != null) windowManager.sendMessageToWebContents(tab.tabSourceWindow.owner, message);
  windowManager.sendMessageToWebContents(tab.owner, message);
}

/** 鼠标移动转发（原 `LHe`）：视口内才转发。 */
export function forwardMouseMove(
  window: { getContentBounds(): { x: number; y: number }; isDestroyed(): boolean },
  frame: { width: number; height: number; x: number; y: number } | null,
  webContents: { isDestroyed(): boolean; sendInputEvent(event: Record<string, unknown>): void } | null,
): void {
  if (window.isDestroyed() || frame == null || webContents == null || webContents.isDestroyed()) return;
  const cursor = screen.getCursorScreenPoint();
  const bounds = window.getContentBounds();
  const x = cursor.x - bounds.x - frame.x;
  const y = cursor.y - bounds.y - frame.y;
  if (x < 0 || y < 0 || x > frame.width || y > frame.height) return;
  webContents.sendInputEvent({ type: "mouseMove", x, y, globalX: cursor.x, globalY: cursor.y, movementX: 0, movementY: 0 });
}

/** 注释快照条目（原 `lW`）。 */
export function commentSnapshotOf(
  window: { activeBrowserTabId?: string; activeConversationId?: string; owner: { id: number }; tabSourceWindow: { owner: { id: number } } | null },
  conversationId: string,
  tab: BrowserTabViewLike & { title: string },
): { active: boolean; browserTabId: string; pageKey: string; title: string; url: string; webContents: ElectronWebContentsLike } | null {
  const webContents = tab.view.webContents;
  return webContents == null || webContents.isDestroyed()
    ? null
    : {
        browserTabId: tab.browserTabId,
        pageKey: pageKey((window.tabSourceWindow ?? window).owner.id, conversationId, tab.browserTabId),
        webContents,
        title: tab.title || tab.fallbackTitle,
        url: effectiveUrl(tab),
        active: window.activeConversationId === conversationId && window.activeBrowserTabId === tab.browserTabId,
      };
}

// ---------------------------------------------------------------------------
// schema（原 `uW`/`UHe`/`WHe`）
// ---------------------------------------------------------------------------

const navigationSchema = (objectSchema({
  currentIndex: (numberSchema() as unknown as { int(): { nullable(): unknown } }).int().nullable(),
  entries: (arraySchema(
    (objectSchema({ pageState: stringSchema().optional(), title: stringSchema(), url: stringSchema() }) as unknown as { strict(): unknown }).strict(),
  ) as unknown as { max(n: number): unknown }).max(MAX_NAVIGATION_ENTRIES),
}) as unknown as { strict(): unknown }).strict();

const pageStateSchema = (objectSchema({
  faviconUrl: stringSchema().nullable(),
  navigation: navigationSchema,
  runtime: literalSchema("electron-webview"),
  title: stringSchema(),
  updatedAt: numberSchema(),
  url: stringSchema(),
}) as unknown as { strict(): { refine(predicate: (value: unknown) => boolean): unknown } }).strict().refine(
  (page) => {
    const navigation = (page as PageState).navigation;
    return navigation.currentIndex == null || (navigation.currentIndex >= 0 && navigation.currentIndex < navigation.entries.length);
  },
);

const storedEntrySchema = (objectSchema({
  browserStorageId: (stringSchema() as unknown as { transform(fn: (value: string) => string): unknown }).transform((value) => value),
  browserTabId: (stringSchema() as unknown as { transform(fn: (value: string) => string): unknown }).transform(browserTabIdOf),
  conversationId: stringSchema(),
  page: pageStateSchema,
}) as unknown as { strict(): unknown }).strict();

const persistedFileSchema = (objectSchema({ pages: recordSchema(stringSchema(), jsonSchema()), version: literalSchema(1) }) as unknown as { strict(): unknown }).strict();

// ---------------------------------------------------------------------------
// store（原 `GHe`/`dW`/`KHe`/`qHe`/`fW`/`JHe`）
// ---------------------------------------------------------------------------

/** 存储条目。 */
export interface StoredPageEntry {
  browserStorageId: string;
  browserTabId: string;
  conversationId: string;
  page: PageState;
}

/** 存储身份（三元组）。 */
export interface BrowserStorageIdentity {
  browserStorageId: string;
  browserTabId: string;
  conversationId: string;
}

/** 页面 schema 校验（原 `fW`）：通过后剥离 attach-token 条目。 */
function validatePageState(value: unknown): PageState | null {
  const parsed = (pageStateSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: PageState } }).safeParse(value);
  return parsed.success ? stripAttachTokenEntries(parsed.data ?? null) : null;
}

/**
 * 字节预算裁剪（原 `dW`）：按 updatedAt 降序逐条累计；JSON 转义感知
 * （原 `KHe`：引号/反斜杠/控制字符/代理对逐字符计费）。
 */
function budgetEntries(entries: Iterable<StoredPageEntry>, maxPages: number, maxBytes: number): StoredPageEntry[] {
  const kept: StoredPageEntry[] = [];
  let totalBytes = Buffer.byteLength(`{"pages":{},"version":1}\n`, "utf8");
  const sorted = Array.from(entries).sort((a, b) => b.page.updatedAt - a.page.updatedAt);
  for (const entry of sorted) {
    if (kept.length >= maxPages) break;
    const parts: unknown[] = [entry.browserStorageId, entry.browserTabId, entry.conversationId, entry.page.faviconUrl, entry.page.title, entry.page.url];
    for (const navigationEntry of entry.page.navigation.entries) {
      if (navigationEntry.pageState != null) parts.push(navigationEntry.pageState);
      parts.push(navigationEntry.title, navigationEntry.url);
    }
    let entryBytes = 0;
    for (const part of parts) {
      if (part != null && ((entryBytes += escapedByteLength(String(part), maxBytes - totalBytes - entryBytes)), totalBytes + entryBytes > maxBytes)) break;
    }
    if (totalBytes + entryBytes > maxBytes) continue;
    const serializedBytes =
      Buffer.byteLength(`${JSON.stringify(entry.browserStorageId)}:${JSON.stringify(entry)}`, "utf8") + (kept.length === 0 ? 0 : 1);
    if (totalBytes + serializedBytes <= maxBytes) {
      kept.push(entry);
      totalBytes += serializedBytes;
    }
  }
  return kept;
}

/** JSON 转义感知字节长度（原 `KHe`）。 */
function escapedByteLength(value: string, budget: number): number {
  let bytes = Buffer.byteLength(value, "utf8") + 2;
  if (bytes > budget || !/["\\\p{Cc}\p{Cs}]/u.test(value)) return bytes;
  for (const char of value) {
    if (char === '"' || char === "\\" || char === "\b" || char === "\t" || char === "\n" || char === "\f" || char === "\r") bytes += 1;
    else if (char < " ") bytes += 5;
    else if (!char.isWellFormed()) bytes += 3;
    if (bytes > budget) return bytes;
  }
  return bytes;
}

/** 读取落盘文件（原 `qHe`）：超限/损坏 → 空列表。 */
function readPersistedFile(path: string, maxBytes: number): StoredPageEntry[] {
  try {
    if (statSync(path).size > maxBytes) return [];
    const parsed = (persistedFileSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: { pages: Record<string, unknown> } } }).safeParse(JSON.parse(readFileSync(path, "utf8")));
    return parsed.success
      ? Object.entries(parsed.data!.pages).flatMap(([browserStorageId, page]) => {
          const entry = (storedEntrySchema as unknown as { safeParse(input: unknown): { success: boolean; data?: Omit<StoredPageEntry, "page"> & { page: unknown } } }).safeParse({
            ...(typeof page === "object" && page ? page : {}),
            browserStorageId,
          });
          if (!entry.success) return [];
          const validated = validatePageState(entry.data!.page);
          return validated == null ? [] : [{ ...entry.data!, page: validated }];
        })
      : [];
  } catch {
    return [];
  }
}

/** 原子写盘（原 `JHe`）：tmp 文件 + rename，失败清理 tmp。 */
function writePersistedFile(path: string, entries: StoredPageEntry[]): void {
  const directory = dirname(path);
  mkdirSync(directory, { recursive: true });
  const tmpPath = join(directory, `.${basename(path)}.tmp-${Date.now()}-${randomUUID()}`);
  try {
    writeFileSync(
      tmpPath,
      `${JSON.stringify({ pages: Object.fromEntries(entries.map(({ browserStorageId, ...rest }) => [browserStorageId, rest])), version: 1 })}\n`,
      "utf8",
    );
    renameSync(tmpPath, path);
  } catch (error) {
    rmSync(tmpPath, { force: true });
    throw error;
  }
}

/** 持久化 store（原 `GHe`）。 */
export class BrowserSidebarPageStore {
  private entries = new Map<string, StoredPageEntry>();

  constructor(
    private persistencePath: string | null,
    private maxBytes: number = PERSISTENCE_MAX_BYTES,
    private maxPages: number = PERSISTENCE_MAX_PAGES,
  ) {
    this.loadPersistedEntries();
  }

  get(browserStorageId: string): PageState | null {
    return this.entries.get(browserStorageId)?.page ?? null;
  }

  getOwner(browserStorageId: string): { browserTabId: string; conversationId: string } | null {
    const entry = this.entries.get(browserStorageId);
    return entry == null ? null : { browserTabId: entry.browserTabId, conversationId: entry.conversationId };
  }

  set(identity: BrowserStorageIdentity, page: unknown): void {
    const validated = validatePageState(page);
    if (validated == null) return;
    const existing = this.entries.get(identity.browserStorageId) ?? null;
    if (existing != null && (existing.browserTabId !== identity.browserTabId || existing.conversationId !== identity.conversationId)) return;
    const existingNavigation = existing == null ? null : persistableNavigationOf(existing.page);
    const nextNavigation = persistableNavigationOf(validated);
    if (existingNavigation != null && nextNavigation == null) return;
    const candidate = new Map(this.entries);
    candidate.set(identity.browserStorageId, { ...identity, page: validated });
    const budgeted = budgetEntries(candidate.values(), this.maxPages, this.maxBytes);
    if (existing == null || budgeted.some((entry) => entry.browserStorageId === identity.browserStorageId)) {
      this.replaceEntries(budgeted);
    }
  }

  reassociate(browserStorageId: string, owner: { browserTabId: string; conversationId: string }): void {
    const entry = this.entries.get(browserStorageId);
    if (entry == null || (entry.browserTabId === owner.browserTabId && entry.conversationId === owner.conversationId)) return;
    this.entries.set(browserStorageId, { browserStorageId, browserTabId: owner.browserTabId, conversationId: owner.conversationId, page: entry.page });
  }

  deleteOwnedAndFlush(identity: BrowserStorageIdentity): boolean {
    return this.deleteOwnedPagesAndFlush([identity]).length === 1;
  }

  deleteOwnedPagesAndFlush(identities: BrowserStorageIdentity[]): string[] {
    const deleted: string[] = [];
    let changed = false;
    for (const identity of identities) {
      const entry = this.entries.get(identity.browserStorageId);
      if (entry == null || (entry.browserTabId === identity.browserTabId && entry.conversationId === identity.conversationId)) {
        if (entry != null) {
          this.entries.delete(identity.browserStorageId);
          changed = true;
        }
        deleted.push(identity.browserStorageId);
      }
    }
    if (changed) this.flushEntries();
    return deleted;
  }

  deleteConversationAndFlush(conversationId: string): string[] {
    const deleted: string[] = [];
    for (const entry of this.entries.values()) {
      if (entry.conversationId === conversationId) {
        this.entries.delete(entry.browserStorageId);
        deleted.push(entry.browserStorageId);
      }
    }
    if (deleted.length > 0) this.flushEntries();
    return deleted;
  }

  flush(): void {
    this.flushEntries();
  }

  private flushEntries(): void {
    const budgeted = budgetEntries(this.entries.values(), this.maxPages, this.maxBytes);
    this.replaceEntries(budgeted);
    if (this.persistencePath != null) {
      try {
        writePersistedFile(this.persistencePath, budgeted);
      } catch (error) {
        logger().warning("failed to persist browser sidebar pages", {
          safe: {},
          sensitive: { error },
        });
      }
    }
  }

  private replaceEntries(entries: StoredPageEntry[]): void {
    this.entries.clear();
    for (const entry of entries) this.entries.set(entry.browserStorageId, entry);
  }

  private loadPersistedEntries(): void {
    if (this.persistencePath == null) return;
    this.replaceEntries(budgetEntries(readPersistedFile(this.persistencePath, this.maxBytes), this.maxPages, this.maxBytes));
  }
}

// ---------------------------------------------------------------------------
// 门面（原 `YHe`/`XHe`/`ZHe`）
// ---------------------------------------------------------------------------

/** 窗口线程记录（结构化子集；persistWindowBeforeShutdown 遍历用）。 */
export interface WindowThreadRecord {
  page: BrowserTabViewLike | null;
  pendingTeardown?: { reason?: string } | null;
}

/** 受管窗口记录（结构化子集）。 */
export interface ManagedWindowRecord {
  isClosing?: boolean;
  threads: Map<string, WindowThreadRecord>;
  window: { on(event: string, listener: (event: unknown) => void): void };
}

/** 页面序列化（原 `ZHe`）：冷恢复直接复用；热序列化校验 URL 一致性。 */
export function serializeTabViewState(tab: BrowserTabViewLike): PageState | null {
  if (tab.isColdRestore && tab.serializedPageState != null) return tab.serializedPageState;
  const webContents = tab.view.webContents;
  if (webContents == null || webContents.isDestroyed()) return tab.serializedPageState;
  const currentUrl = blankableUrl(webContents.getURL());
  const loadError = findLoadError(tab, currentUrl);
  const effectiveCurrentUrl = loadError?.failedUrl ?? currentUrl;
  if (tab.pendingUrl.length > 0 && normalizeUrl(tab.pendingUrl) !== normalizeUrl(effectiveCurrentUrl)) return tab.serializedPageState;
  const next = pageStateFromWebContents({ pageState: tab, title: tab.title || tab.fallbackTitle, url: effectiveUrl(tab), webContents });
  const previous = tab.serializedPageState;
  return persistableNavigationOf(next) != null || previous == null || persistableNavigationOf(previous) == null ? next : previous;
}

function normalizeUrl(url: string): string {
  const normalized = url.length === 0 || url === "about:blank" ? "" : url;
  if (normalized.length === 0) return normalized;
  try {
    return new URL(normalized).href;
  } catch {
    return normalized;
  }
}

/** 持久化门面（原 `YHe`）：enable/delete/reassociate/persist + 窗口关闭钩子。 */
export class BrowserSidebarPagePersistence {
  private deletedBrowserStorageIds = new Set<string>();
  private enabledBrowserStorageIds = new Set<string>();

  constructor(private store: BrowserSidebarPageStore) {}

  enablePersistence(identity: BrowserStorageIdentity): void {
    this.enabledBrowserStorageIds.add(identity.browserStorageId);
  }

  hasDurableStorageIdentity(browserStorageId: string): boolean {
    return this.enabledBrowserStorageIds.has(browserStorageId) || this.deletedBrowserStorageIds.has(browserStorageId) || this.store.getOwner(browserStorageId) != null;
  }

  isDurableStorageIdentityOwnedBy(identity: BrowserStorageIdentity): boolean {
    const owner = this.store.getOwner(identity.browserStorageId);
    return owner != null && owner.browserTabId === identity.browserTabId && owner.conversationId === identity.conversationId;
  }

  deleteOwnedPagesAndFlush(identities: BrowserStorageIdentity[]): void {
    this.markDeleted(this.store.deleteOwnedPagesAndFlush(identities));
  }

  deleteConversationAndFlush(conversationId: string, identities: BrowserStorageIdentity[]): void {
    this.deleteOwnedPagesAndFlush(identities);
    this.markDeleted(this.store.deleteConversationAndFlush(conversationId));
  }

  private markDeleted(browserStorageIds: string[]): void {
    for (const id of browserStorageIds) {
      this.enabledBrowserStorageIds.delete(id);
      this.deletedBrowserStorageIds.add(id);
    }
  }

  get(identity: BrowserStorageIdentity): PageState | null {
    if (!this.enabledBrowserStorageIds.has(identity.browserStorageId)) return null;
    const owner = this.store.getOwner(identity.browserStorageId);
    return owner == null || owner.browserTabId !== identity.browserTabId || owner.conversationId !== identity.conversationId
      ? null
      : this.store.get(identity.browserStorageId);
  }

  getDebugMetadata(identity: BrowserStorageIdentity): { historyEntryCount: number; updatedAtMs: number } | null {
    const page = this.get(identity);
    return page == null ? null : { historyEntryCount: page.navigation.entries.length, updatedAtMs: page.updatedAt };
  }

  persistCurrent(tab: BrowserTabViewLike): void {
    if (this.deletedBrowserStorageIds.has(tab.browserStorageId)) return;
    tab.serializedPageState = serializeTabViewState(tab);
    if (this.enabledBrowserStorageIds.has(tab.browserStorageId) && tab.serializedPageState != null) {
      this.store.set(
        { browserStorageId: tab.browserStorageId, browserTabId: tab.browserTabId, conversationId: tab.conversationId },
        tab.serializedPageState,
      );
    }
  }

  persistCurrentAndFlush(tab: BrowserTabViewLike): void {
    this.persistCurrent(tab);
    this.store.flush();
  }

  deleteAndFlush(identity: BrowserStorageIdentity): boolean {
    const deleted = this.store.deleteOwnedAndFlush(identity);
    if (deleted) this.enabledBrowserStorageIds.delete(identity.browserStorageId);
    return deleted;
  }

  deleteClosedPageAndFlush(identity: BrowserStorageIdentity): void {
    const hadDurableIdentity = this.hasDurableStorageIdentity(identity.browserStorageId);
    if (this.deleteAndFlush(identity) && hadDurableIdentity) this.deletedBrowserStorageIds.add(identity.browserStorageId);
  }

  reassociateAndFlush(identity: BrowserStorageIdentity): void {
    if (!this.enabledBrowserStorageIds.has(identity.browserStorageId)) return;
    this.store.reassociate(identity.browserStorageId, { browserTabId: identity.browserTabId, conversationId: identity.conversationId });
    this.store.flush();
  }

  persistWindowBeforeShutdown(window: ManagedWindowRecord): void {
    for (const thread of window.threads.values()) {
      const page = thread.page;
      if (page != null && thread.pendingTeardown?.reason !== "closed") this.persistCurrent(page);
    }
    this.store.flush();
  }

  /** 窗口关闭钩子（原 `registerWindowShutdown`）：close/query-session-end 落盘。 */
  registerWindowShutdown(window: ManagedWindowRecord, onClosed: () => void, onClosedFinal: () => void): void {
    let settled = false;
    const persist = () => {
      this.persistWindowBeforeShutdown(window);
    };
    const settle = () => {
      if (!settled) {
        settled = true;
        onClosed();
      }
    };
    window.window.on("close", (event) => {
      persist();
      window.isClosing = !(event as { defaultPrevented?: boolean }).defaultPrevented;
      queueMicrotask(() => {
        window.isClosing = !(event as { defaultPrevented?: boolean }).defaultPrevented;
        if (window.isClosing) settle();
      });
    });
    window.window.on("query-session-end", () => {
      window.isClosing = true;
      persist();
      settle();
    });
    window.window.on("closed", onClosedFinal);
  }
}

/** 工厂（原 `XHe`）。 */
export function createBrowserSidebarPagePersistence(userDataPath: string | null): BrowserSidebarPagePersistence {
  return new BrowserSidebarPagePersistence(new BrowserSidebarPageStore(userDataPath == null ? null : join(userDataPath, PERSISTENCE_FILENAME)));
}

export { loadErrorMessage, formatErrorCode, textDirectionOf, localeOf, normalizedHost, jsonForEmbedding, clamp, atLeastOne };
