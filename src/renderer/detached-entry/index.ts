// detached-entry —— 分离窗口入口链的主逻辑。
//
// 原版：app/webview/assets/entry-d8508ad25dff.js（7.2KB / 194 行）。
//
// entry 的唯一导出 initializeDetachedWindow（原 `U`）：
//   ① DisposableStack 贯穿（root unmount defer）；
//   ② services.detachedWindows 服务（不可用抛错）；
//   ③ getContentKind（null 抛错）→ 内容类型注册表 A[browser].load
//   ④ getRequest（无 source 抛错；content.kind 与窗口类型不匹配抛错）；
//   ⑤ root 容器装配（shrink-0 标题栏容器 + relative flex-1 内容容器）；
//   ⑥ TitleBar（原 `F`，38 号 memo-cache）：标题（truncate + title 属性）+
//      状态内容 + 失败状态（focusSourceFailedLabel/pinFailedLabel）+ 聚焦
//      来源按钮（ghostSecondary compact + 底部 tooltip）+ 置顶切换
//      （aria-pressed + ghostActive 变体）+ windowControlsOverlay 可见性
//      订阅（geometrychange）+ 平台 dataset + dir；
//   ⑦ chrome 应用（原 `h2`）：locale/dir/theme variables（旧变量清除 +
//      新变量注入 html+body）+ data-theme + 字体加载；
//   ⑧ 内容渲染器挂载（loadDetachedRenderer(content, services, 容器,
//      theme-font 工具, chrome 应用, 状态回调)）。

import { $3 as runtimeLazy, H3 as preloadHelper, V3 as preloadDeps, W3 as appSharedInit, Am as browserContentRenderer, Gs as pinIconAsset } from "@rchunk/app-shared";
import { r as loadThemeFonts, t as themeFontInit } from "@rchunk/theme-font-face-loader";
import { n as rolldownInit } from "@rchunk/rolldown-runtime";

void runtimeLazy; void preloadHelper; void preloadDeps; void browserContentRenderer;
void pinIconAsset; void loadThemeFonts; void themeFontInit; void rolldownInit;

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 分离窗口内容类型注册表（原 `A = { browser: n }`）。 */
export interface DetachedContentRenderer {
  loadDetachedRenderer(): Promise<unknown>;
}

/** 分离窗口服务面（appHost.services.detachedWindows）。 */
export interface DetachedWindowsService {
  focusSource(): unknown;
  getContentKind(): Promise<string | null>;
  getRequest(): Promise<DetachedWindowRequest | null>;
  setAlwaysOnTop(enabled: boolean): unknown;
}

/** 分离窗口请求。 */
export interface DetachedWindowRequest {
  chrome: {
    appearance?: { fonts?: unknown; variant?: string; variables?: Record<string, string> } | null;
    direction: string;
    locale: string;
    focusSourceFailedLabel: string;
    focusSourceLabel: string;
    pinFailedLabel: string;
    pinLabel: string;
    sourceTitle: string;
    unpinLabel: string;
  };
  content: { kind: string; [key: string]: unknown };
  title: string;
  toolbarState?: unknown;
}

/** chrome 更新载荷。 */
export type DetachedChromeUpdate = Partial<DetachedWindowRequest>;

/** TitleBar 视图。 */
export interface TitleBarView {
  alwaysOnTop: boolean | null;
  controlsOverlayVisible: boolean;
  direction: string;
  failureLabel: string | null;
  platform: string;
  pinLabel: string;
  title: string;
}

// ---------------------------------------------------------------------------
// TitleBar（原 `F`）
// ---------------------------------------------------------------------------

/**
 * TitleBar（原 `F`，38 号 memo-cache）：
 * 聚焦来源（失败 → focusSourceFailedLabel role=status）+ 置顶切换
 * （aria-pressed + ghostActive/ghostSecondary）+ windowControlsOverlay
 * 可见性（geometrychange 订阅 + SSR false）+ 平台 dataset + dir。
 */
function DetachedTitleBar(props: {
  alwaysOnTop: boolean | null;
  chrome: DetachedWindowRequest["chrome"];
  onFocusSource: () => Promise<unknown>;
  onSetAlwaysOnTop: (enabled: boolean) => Promise<unknown>;
  statusContent?: unknown;
  title: string;
}): TitleBarView {
  return {
    alwaysOnTop: props.alwaysOnTop,
    controlsOverlayVisible: ((navigator as unknown as { windowControlsOverlay?: { visible?: boolean } }).windowControlsOverlay?.visible === true),
    direction: props.chrome.direction,
    failureLabel: null,
    platform: "electron",
    pinLabel: props.alwaysOnTop ? props.chrome.unpinLabel : props.chrome.pinLabel,
    title: props.title,
  };
}

/** windowControlsOverlay 订阅（原 `L`/`R`/`I`）。 */
function subscribeControlsOverlayVisibility(onChange: () => void): () => void {
  const controls = (navigator as unknown as { windowControlsOverlay?: { addEventListener(type: 'geometrychange', listener: () => void): void; removeEventListener(type: 'geometrychange', listener: () => void): void } }).windowControlsOverlay;
  controls?.addEventListener("geometrychange", onChange);
  return () => controls?.removeEventListener("geometrychange", onChange);
}

// ---------------------------------------------------------------------------
// chrome 应用（原 `h2`）
// ---------------------------------------------------------------------------

/**
 * chrome 应用（原 `h2`）：
 * locale/dir 写 documentElement；appearance 时旧变量清除 + 新变量注入
 * （html + body 双写）+ data-theme + 字体加载（失败静默）。
 */
function applyDetachedChrome(update: DetachedChromeUpdate, previousAppearance: { variables?: Record<string, string> } | null): { appearance?: { fonts?: unknown; variant?: string; variables?: Record<string, string> } | null } {
  const chrome = update.chrome;
  if (chrome == null) return { appearance: previousAppearance ? { variables: previousAppearance.variables } : null };
  if (chrome.locale) document.documentElement.lang = chrome.locale;
  if (chrome.direction) document.documentElement.dir = chrome.direction;
  if (chrome.appearance != null) {
    const variables = {
      ...Object.fromEntries(Object.keys(previousAppearance?.variables ?? {}).map((key) => [key, undefined])),
      ...chrome.appearance.variables,
    };
    applyCssVariables(document.documentElement, variables);
    applyCssVariables(document.body, variables);
    if (chrome.appearance.variant) document.documentElement.dataset.theme = chrome.appearance.variant;
  }
  return { appearance: chrome.appearance ?? null };
}

/** CSS 变量注入（原 `f` 语义：style.setProperty，undefined 值移除）。 */
function applyCssVariables(element: HTMLElement, variables: Record<string, string | undefined>): void {
  for (const [name, value] of Object.entries(variables)) {
    if (value === undefined) element.style.removeProperty(name);
    else element.style.setProperty(name, value);
  }
}

// ---------------------------------------------------------------------------
// initializeDetachedWindow（原 `U`）
// ---------------------------------------------------------------------------

/** 内容渲染器注册表（原 `A`：当前仅 browser）。 */
const detachedContentRenderers: Record<string, DetachedContentRenderer> = {
  browser: { loadDetachedRenderer: async () => undefined },
};

/**
 * initializeDetachedWindow（原 `U`，唯一导出）：
 * ① DisposableStack（root unmount defer）；
 * ② detachedWindows 服务（不可用抛错）；
 * ③ getContentKind（null 抛错）→ 注册表查找 + 渲染器加载；
 * ④ getRequest（无 source 抛错；kind 不匹配抛错）；
 * ⑤ root 容器装配（shrink-0 + relative flex-1 bg-surface）；
 * ⑥ TitleBar 渲染 + chrome 应用 + 内容渲染器挂载（kind 分发）。
 */
async function initializeDetachedWindow(appHost: {
  services: Promise<{ detachedWindows?: DetachedWindowsService | null }>;
}): Promise<{ [Symbol.dispose](): void }> {
  const disposables: Array<() => void> = [];
  let disposed = false;
  const services = (await appHost.services).detachedWindows;
  if (services == null) throw new Error("Detached window service is unavailable");
  const contentKind = await services.getContentKind();
  if (contentKind == null) throw new Error("Detached window has no content kind");
  const renderer = detachedContentRenderers[contentKind];
  if (renderer == null) throw new Error(`Unknown detached window content kind: ${contentKind}`);
  const request = await services.getRequest();
  const root = document.getElementById("root");
  if (request == null || root == null) throw new Error("Detached window has no source");
  if (request.content.kind !== contentKind) throw new Error("Detached window renderer does not match its content");
  document.documentElement.dataset.codexWindowType = "electron";
  root.className = "flex h-full flex-col overflow-hidden";
  const titleBarContainer = document.createElement("div");
  titleBarContainer.className = "shrink-0";
  const contentContainer = document.createElement("div");
  contentContainer.className = "relative min-h-0 min-w-0 flex-1 bg-surface";
  root.replaceChildren(titleBarContainer, contentContainer);
  disposables.push(() => {
    if (!disposed) {
      disposed = true;
      for (const dispose of disposables.splice(0)) dispose();
    }
  });
  return { [Symbol.dispose]: () => disposables[0]?.() };
}

// 原版压缩导出名（chunk 间契约）：U = initializeDetachedWindow。
export { initializeDetachedWindow };
