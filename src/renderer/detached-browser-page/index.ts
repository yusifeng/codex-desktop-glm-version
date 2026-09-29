// detached-browser-page — detached browser toolbar, webview host, and window-transfer receiver.

import * as appSharedChunk from "@rchunk/app-shared";
import * as browsingDataChunk from "@rchunk/browser-browsing-data-dialog";
import * as optionsMenuChunk from "@rchunk/options-menu-view";
import * as profileChunk from "@rchunk/profile";
import * as addressInputChunk from "@rchunk/tab-address-input";
import "@rchunk/rolldown-runtime";

interface DisposableLike { [Symbol.dispose](): void }
interface Rect { height: number; width: number; x: number; y: number }
interface Snapshot extends Record<string, unknown> {
  isAudible?: boolean; isAudioMuted?: boolean; isCapturingCamera?: boolean; isCapturingMicrophone?: boolean; isCapturingUserMedia?: boolean; securityState?: string; tabType?: string; title: string; url: string; zoomPercent: number;
}
interface DeviceToolbarState { height: number; isEnabled: boolean; presetId: string; width: number }
interface BrowserContentData {
  browserTabId: string; conversationId: string; cursorColor?: string; deviceToolbarTabState: { responsiveViewportSize: { height: number; width: number } | null; toolbarState: DeviceToolbarState }; panelTarget?: unknown; snapshot: Snapshot;
}
interface DetachedBrowserRequest {
  content: { data: BrowserContentData; kind: "browser" }; durableRoute?: { params?: Record<string, unknown>; [key: string]: unknown } | null; title: string; toolbarState: { data: ToolbarState; kind: "browser" };
}
interface ToolbarState extends Record<string, unknown> {
  browserIntlConfig?: Record<string, unknown>; browserToolbarCapabilities?: { annotationModeEnabled?: boolean; isDefaultBrowser?: boolean; reduceMotion?: boolean; tweaksEnabled?: boolean; zeroStateAutocompleteEnabled?: boolean }; openAIGoLinksEnabled?: boolean; showFullUrl?: boolean; siteActions?: unknown;
}
interface BrowserCommand { type: string; [key: string]: unknown }
interface PageCommand { browserTabId: string; command: BrowserCommand; conversationId: string }
interface BrowserHostService extends Partial<DisposableLike> {
  adoptForWindowTransfer?(token: unknown): unknown; focus?(): void; markRegistered?(): void; registerWebviewHost(input: Record<string, unknown>): Promise<boolean>; registerWebviewHostSession(input: { rendererInstanceId: string }): Promise<boolean>; releaseBrowserUse?(): void; runPageCommand(input: PageCommand): Promise<unknown>; setBrowserUseActive?(active: boolean): void; setBrowserUseCaptureSurfaceSize?(size: unknown): void; setBrowserUseViewportSize?(size: { height: number; width: number } | null): void; setTabCaptureActive?(active: boolean): void; shouldDestroyForHostRequest?(message: Record<string, unknown>): boolean; subscribePermissionPrompts?(target: { browserTabId: string; conversationId: string }, listener: (prompts: unknown[]) => void): Promise<DisposableLike> | DisposableLike; syncView(input: Record<string, unknown>): Promise<unknown>; whenWindowTransferPrepared?(): Promise<boolean>; whenWindowTransferPresented?(): Promise<boolean>;
}
interface ToolbarService extends Partial<DisposableLike> {
  forwardBrowserAnnotationMessage?(message: unknown): Promise<unknown>; recordBrowserAddressCommit?(input: unknown): Promise<unknown>; recordBrowserAutocompleteSuggestionsShown?(input: unknown): Promise<unknown>; recordBrowserNavigation?(input: Record<string, unknown>): Promise<unknown>; requestBrowserToolbarAction?(action: unknown): Promise<unknown> | unknown;
}
interface DetachedWindowsService extends Partial<DisposableLike> {
  cloneTab?(input: Record<string, unknown>): Promise<unknown>; close(): Promise<unknown>; getToolbarService(): Promise<{ kind: string; service: ToolbarService } | null>; setReceiver(receiver: DetachedBrowserReceiver, updateChrome: (update: unknown) => void): Promise<boolean>; updateTab?(title: string, route?: unknown): Promise<unknown>;
}
interface DownloadsService extends Partial<DisposableLike> { subscribe?(listener: (downloads: unknown) => void): Promise<DisposableLike | null> | DisposableLike | null }
interface Services { browserAutocomplete?: Promise<unknown> | unknown; browserHost?: Promise<BrowserHostService | null> | BrowserHostService | null; browsingHistory?: Promise<unknown> | unknown; detachedWindows?: Promise<DetachedWindowsService | null> | DetachedWindowsService | null; downloads?: Promise<DownloadsService | null> | DownloadsService | null }
interface AppHost { services: Services }
interface ReactRoot { render(node: unknown): void; unmount(): void }
interface JsxRuntime { Fragment: unknown; jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown }
interface ReactRuntime {
  useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void; useState<Value>(initial: Value | (() => Value)): [Value, (next: Value | ((current: Value) => Value)) => void];
}
interface AppSharedRuntime {
  $3(): void; I3(): JsxRuntime; K2(): void; N3(): { createRoot(element: HTMLElement): ReactRoot }; P3(): { flushSync(callback: () => void): void }; W3(): void; e6(): ReactRuntime;
}
interface BrowserOptionsProps { currentZoomPercent: number; isDeviceToolbarEnabled: boolean; isDeviceToolbarVisible: boolean; onOpenChange(open: boolean): void; onOpenFindInPage(): void; onResetZoom(): void; onToggleDeviceToolbar(): void; onZoomIn(): void; onZoomOut(): void }
interface AnnotationModule { DetachedBrowserAnnotationButton?: unknown; DetachedBrowserTweaksToolbar?: unknown }
interface LayoutPayload { content: unknown; headerRows: Array<{ content: unknown; id: string }> }
interface DetachedBrowserReceiver { attach(content: { data: { token?: unknown }; kind: string }): unknown; getContent(): Promise<{ data: BrowserContentData; kind: "browser" }>; whenPrepared(): Promise<boolean>; whenReady(): Promise<boolean> }

const { $3: initializeRuntime, I3: getJsxRuntime, K2: initializeUi, N3: getReactDomClient, P3: getReactDomRuntime, W3: initializeShared, e6: getReactRuntime } = appSharedChunk as unknown as AppSharedRuntime;
const { n: initializeOptions, k: translateZoomCommand, t: BrowserOptionsMenu } = optionsMenuChunk as unknown as { n(): void; k(input: { command: BrowserCommand; currentRenderedZoomPercent: number; viewportScale: number }): { command: BrowserCommand }; t: (props: BrowserOptionsProps) => unknown };
const { n: initializeAddressInput, t: TabAddressInput } = addressInputChunk as unknown as { n(): void; t: unknown };
const { n: initializeBrowsingData } = browsingDataChunk as unknown as { n(): void };
void profileChunk;

const VIEWPORT_BACKGROUND = "var(--color-surface-primary, transparent)";
const FORWARDED_ANNOTATION_MESSAGES = new Set(["browser-sidebar-comment-overlay-insert-text", "browser-sidebar-comment-overlay-session", "browser-sidebar-direct-comment", "browser-sidebar-floating-composer-reveal", "browser-sidebar-image-attachment", "browser-sidebar-image-drag-state"]);
let annotationModulePromise: Promise<AnnotationModule> | null = null;
function loadAnnotationModule(): Promise<AnnotationModule> {
  // @ts-ignore -- published dynamic chunk; declarations are generated with the shared manifest.
  annotationModulePromise ??= import("@rchunk/annotation-controls") as Promise<AnnotationModule>;
  return annotationModulePromise;
}
function asDisposable(value: unknown): DisposableLike | null { return value != null && typeof value === "object" && Symbol.dispose in value ? value as DisposableLike : null; }
function toRect(element: HTMLElement): Rect { const rect = element.getBoundingClientRect(); return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }; }
function clampDimension(value: number): number { return Math.max(1, Math.round(Number.isFinite(value) ? value : 1)); }
function rotateToolbar(state: DeviceToolbarState): DeviceToolbarState { return { ...state, width: state.height, height: state.width }; }
function parseMessage(event: MessageEvent): Record<string, unknown> | null { return event.data != null && typeof event.data === "object" ? event.data as Record<string, unknown> : null; }

function BrowserToolbar({ controller }: { controller: DetachedBrowserController }): unknown {
  const React = getReactRuntime();
  const jsx = getJsxRuntime();
  const snapshot = controller.snapshot;
  const capabilities = controller.toolbarState.browserToolbarCapabilities ?? {};
  const [address, setAddress] = React.useState(snapshot.url);
  const [findOpen, setFindOpen] = React.useState(false);
  const [findQuery, setFindQuery] = React.useState("");
  const [annotation, setAnnotation] = React.useState<AnnotationModule | null>(null);
  const browserTabId = controller.browserTabId;
  const conversationId = controller.conversationId;
  React.useEffect(() => { setAddress(snapshot.url); }, [snapshot.url]);
  React.useEffect(() => {
    if (!capabilities.annotationModeEnabled && !capabilities.tweaksEnabled) return;
    let active = true;
    void loadAnnotationModule().then((loaded) => { if (active) setAnnotation(loaded); });
    return () => { active = false; };
  }, [capabilities.annotationModeEnabled, capabilities.tweaksEnabled]);
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") { event.preventDefault(); setFindOpen(true); requestAnimationFrame(() => document.getElementById("browser-page-find-input")?.focus()); }
      if (event.key === "Escape" && findOpen) { event.preventDefault(); setFindOpen(false); controller.focusPage(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [findOpen]);
  const run = (command: BrowserCommand) => { void controller.runCommand({ browserTabId, conversationId, command }); };
  const annotationButton = capabilities.annotationModeEnabled && annotation?.DetachedBrowserAnnotationButton ? jsx.jsx(annotation.DetachedBrowserAnnotationButton, { browserTabId, conversationId, snapshot, onError: controller.reportError }) : null;
  const tweaksToolbar = capabilities.tweaksEnabled && annotation?.DetachedBrowserTweaksToolbar ? jsx.jsx(annotation.DetachedBrowserTweaksToolbar, { browserTabId, conversationId, snapshot, viewport: controller.viewport }) : null;
  return jsx.jsxs(jsx.Fragment, { children: [jsx.jsxs("div", { className: "flex h-12 items-center gap-1 border-b px-2", children: [
    jsx.jsx("button", { "aria-label": "Back", onClick: () => run({ type: "go-back" }), type: "button", children: "←" }),
    jsx.jsx("button", { "aria-label": "Next", onClick: () => run({ type: "go-forward" }), type: "button", children: "→" }),
    jsx.jsx("button", { "aria-label": "Reload page", onClick: () => run({ type: "reload" }), type: "button", children: "↻" }),
    jsx.jsx(TabAddressInput, { addressValue: address, currentAddress: snapshot.url, id: "detached-browser-address", isAddressEditing: true, onAddressValueChange: setAddress, onCancelAddressEditing: () => setAddress(snapshot.url), onCommitAddress: (value: string) => { setAddress(value); run({ type: "navigate", url: value }); }, onFind: () => setFindOpen(true), placeholder: "Search or enter a URL", sources: [] }),
    annotationButton,
    jsx.jsx(BrowserOptionsMenu, { currentZoomPercent: snapshot.zoomPercent, isDeviceToolbarEnabled: controller.deviceToolbarState.isEnabled, isDeviceToolbarVisible: true, onOpenChange: () => undefined, onOpenFindInPage: () => setFindOpen(true), onResetZoom: () => run({ type: "reset-zoom" }), onToggleDeviceToolbar: controller.toggleDeviceToolbar, onZoomIn: () => run({ type: "step-zoom", delta: 1 }), onZoomOut: () => run({ type: "step-zoom", delta: -1 }) })
  ] }), findOpen ? jsx.jsxs("div", { className: "absolute right-4 top-14 z-50", children: [jsx.jsx("input", { id: "browser-page-find-input", onChange: (event: { currentTarget: { value: string } }) => setFindQuery(event.currentTarget.value), placeholder: "Find in page", value: findQuery }), jsx.jsx("button", { onClick: () => run({ type: "find-previous" }), type: "button", children: "Previous" }), jsx.jsx("button", { onClick: () => run({ type: "find-next" }), type: "button", children: "Next" }), jsx.jsx("button", { onClick: () => { setFindOpen(false); run({ type: "close-find" }); controller.focusPage(); }, type: "button", children: "Close" })] }) : null, tweaksToolbar] });
}

class DetachedBrowserController implements DetachedBrowserReceiver {
  readonly rendererInstanceId = crypto.randomUUID();
  readonly browserTabId: string; readonly conversationId: string; readonly viewport: HTMLElement;
  snapshot: Snapshot; toolbarState: ToolbarState; deviceToolbarState: DeviceToolbarState;
  private readonly root: ReactRoot; private readonly disposables: DisposableLike[] = []; private disposed = false; private isBrowserUseActive = false; private permissionPrompt: unknown = null; private viewportScale = 1;
  constructor(readonly request: DetachedBrowserRequest, private readonly browserHost: BrowserHostService, private readonly detachedWindows: DetachedWindowsService, private readonly toolbarService: ToolbarService, private readonly downloads: DownloadsService | null, container: HTMLElement, private readonly renderLayout: (payload: LayoutPayload) => unknown, private readonly setChromeState: (update: unknown) => void, private readonly setStatusContent: (content: unknown) => void) {
    const data = request.content.data; this.browserTabId = data.browserTabId; this.conversationId = data.conversationId; this.snapshot = data.snapshot; this.toolbarState = request.toolbarState.data; this.deviceToolbarState = { ...data.deviceToolbarTabState.toolbarState, width: clampDimension(data.deviceToolbarTabState.toolbarState.width), height: clampDimension(data.deviceToolbarTabState.toolbarState.height) };
    this.viewport = document.createElement("div"); this.viewport.className = "relative h-full min-h-0 min-w-0 overflow-hidden"; this.viewport.style.backgroundColor = this.deviceToolbarState.isEnabled ? VIEWPORT_BACKGROUND : "";
    this.root = getReactDomClient().createRoot(container); this.render();
    const observer = new ResizeObserver(this.sync); observer.observe(this.viewport); this.disposables.push({ [Symbol.dispose]: () => observer.disconnect() });
    window.addEventListener("message", this.onMessage); this.disposables.push({ [Symbol.dispose]: () => window.removeEventListener("message", this.onMessage) });
    void Promise.resolve(downloads?.subscribe?.(() => this.render()) ?? null).then((subscription) => { const disposable = asDisposable(subscription); if (this.disposed) disposable?.[Symbol.dispose](); else if (disposable) this.disposables.push(disposable); }).catch(() => { if (!this.disposed) this.reportError("Unable to load downloads"); });
  }
  private render = (): void => {
    if (this.disposed) return; const jsx = getJsxRuntime(); const content = jsx.jsx("div", { className: "relative h-full min-h-0 min-w-0 overflow-hidden", ref: (node: HTMLElement | null) => { if (node && this.viewport.parentElement !== node) node.replaceChildren(this.viewport); }, children: null }); const toolbar = jsx.jsx(BrowserToolbar, { controller: this });
    getReactDomRuntime().flushSync(() => this.root.render(this.renderLayout({ headerRows: [{ id: "browser-navigation", content: toolbar }], content })));
    if (!this.viewport.isConnected && typeof document !== "undefined") throw new Error("Detached Browser viewport did not mount");
  };
  async prepare(): Promise<void> {
    const registeredSession = await this.browserHost.registerWebviewHostSession({ rendererInstanceId: this.rendererInstanceId }); if (this.disposed) throw new Error("Detached Browser page was disposed during preparation"); if (!registeredSession) throw new Error("Detached window session registration was rejected");
    const registeredHost = await this.browserHost.registerWebviewHost({ browserTabId: this.browserTabId, conversationId: this.conversationId, hostGeneration: 1, rendererInstanceId: this.rendererInstanceId }); if (this.disposed) throw new Error("Detached Browser page was disposed during preparation"); if (!registeredHost) throw new Error("Detached window host registration was rejected");
    const promptSubscription = await this.browserHost.subscribePermissionPrompts?.({ browserTabId: this.browserTabId, conversationId: this.conversationId }, (prompts) => { if (!this.disposed) { this.permissionPrompt = prompts[0] ?? null; this.updateStatus(); } }); const disposable = asDisposable(promptSubscription); if (disposable) this.disposables.push(disposable);
    this.browserHost.markRegistered?.(); this.sync();
    const accepted = await this.detachedWindows.setReceiver(this, (update) => { this.setChromeState(update); this.updateChrome(update); }); if (!accepted) throw new Error("Detached window receiver registration was rejected");
  }
  async getContent(): Promise<{ data: BrowserContentData; kind: "browser" }> { return { kind: "browser", data: { ...this.request.content.data, snapshot: this.snapshot, deviceToolbarTabState: { ...this.request.content.data.deviceToolbarTabState, toolbarState: this.deviceToolbarState } } }; }
  updateChrome(update: unknown): void { const toolbarState = (update as { toolbarState?: { data?: ToolbarState; kind?: string } })?.toolbarState; if (!this.disposed && toolbarState?.kind === "browser" && toolbarState.data) { this.toolbarState = toolbarState.data; this.updateStatus(); this.render(); this.sync(); } }
  async whenPrepared(): Promise<boolean> { return await (this.browserHost.whenWindowTransferPrepared?.() ?? Promise.resolve(true)); }
  attach(content: { data: { token?: unknown }; kind: string }): unknown { return content.kind === "browser" ? this.browserHost.adoptForWindowTransfer?.(content.data.token) : undefined; }
  async whenReady(): Promise<boolean> { return await (this.browserHost.whenWindowTransferPresented?.() ?? Promise.resolve(true)); }
  focusPage = (): void => { this.browserHost.focus?.(); };
  focusAddress = (): void => { const input = document.getElementById("detached-browser-address"); if (input instanceof HTMLInputElement) { input.focus(); input.select(); } };
  reportError = (message: string): void => { this.setStatusContent(getJsxRuntime().jsx("p", { role: "alert", children: message })); };
  runCommand = (input: PageCommand): Promise<unknown> => {
    const type = input.command.type; if (type !== "step-zoom" && type !== "reset-zoom" && type !== "set-zoom-percent") return this.browserHost.runPageCommand(input);
    const translated = translateZoomCommand({ command: input.command, currentRenderedZoomPercent: this.snapshot.zoomPercent, viewportScale: this.viewportScale }); return this.browserHost.runPageCommand({ ...input, command: translated.command });
  };
  setDeviceToolbarState = (state: DeviceToolbarState, options: { shouldResetPageZoom?: boolean } = {}): void => { this.deviceToolbarState = { ...state, width: clampDimension(state.width), height: clampDimension(state.height) }; this.render(); this.sync(); if (options.shouldResetPageZoom) void this.runCommand({ browserTabId: this.browserTabId, conversationId: this.conversationId, command: { type: "set-zoom-percent", zoomPercent: 100 } }); };
  rotateDeviceToolbar = (): void => this.setDeviceToolbarState(rotateToolbar(this.deviceToolbarState));
  toggleDeviceToolbar = (): void => this.setDeviceToolbarState({ ...this.deviceToolbarState, isEnabled: !this.deviceToolbarState.isEnabled });
  sync = (): void => { if (this.disposed) return; const bounds = toRect(this.viewport); this.viewport.style.backgroundColor = this.deviceToolbarState.isEnabled ? VIEWPORT_BACKGROUND : ""; const scaleX = this.deviceToolbarState.isEnabled ? Math.min(1, bounds.width / this.deviceToolbarState.width) : 1; const scaleY = this.deviceToolbarState.isEnabled ? Math.min(1, bounds.height / this.deviceToolbarState.height) : 1; this.viewportScale = Math.max(0.1, Math.min(scaleX, scaleY)); void this.browserHost.syncView({ browserTabId: this.browserTabId, bounds, conversationId: this.conversationId, emulatedViewportSize: this.deviceToolbarState.isEnabled ? { width: this.deviceToolbarState.width, height: this.deviceToolbarState.height } : null, hostKind: "right-panel", mountGeneration: 1, presented: true, viewportScale: this.viewportScale, visible: true }); };
  private updateStatus(): void { if (this.permissionPrompt == null && !this.isBrowserUseActive) this.setStatusContent(null); else this.setStatusContent(getJsxRuntime().jsx("div", { "data-browser-active": this.isBrowserUseActive, children: this.permissionPrompt == null ? "Browser is under agent control" : "Browser permission requested" })); }
  private onMessage = (event: MessageEvent): void => {
    const message = parseMessage(event); if (message == null) return;
    if (message.type === "run-command") { if (message.id === "closeTab") { void this.detachedWindows.close(); return; } if (message.id === "focusBrowserAddressBar") { this.focusAddress(); return; } }
    if (message.browserTabId !== this.browserTabId || message.conversationId !== this.conversationId) return;
    switch (message.type) {
      case "browser-sidebar-state": { const next = message.snapshot as Snapshot; const changed = next.title !== this.snapshot.title || next.url !== this.snapshot.url; this.snapshot = next; this.render(); this.sync(); void this.toolbarService.forwardBrowserAnnotationMessage?.(message); if (changed) void this.detachedWindows.updateTab?.(next.title || next.url, this.request.durableRoute == null ? undefined : { ...this.request.durableRoute, params: { ...this.request.durableRoute.params, restoreUrl: next.url } }); break; }
      case "close-browser-tab": void this.detachedWindows.close(); break;
      case "browser-sidebar-browser-use-state": this.isBrowserUseActive = message.isActive === true; this.browserHost.setBrowserUseActive?.(this.isBrowserUseActive); this.updateStatus(); this.sync(); break;
      case "browser-sidebar-browser-use-page-released": this.isBrowserUseActive = false; this.browserHost.releaseBrowserUse?.(); this.updateStatus(); this.sync(); break;
      case "browser-sidebar-browser-use-viewport": { const size = message.viewportSize as { height: number; width: number } | null; this.browserHost.setBrowserUseViewportSize?.(size); this.setDeviceToolbarState(size == null ? { ...this.deviceToolbarState, isEnabled: false } : { ...this.deviceToolbarState, width: clampDimension(size.width), height: clampDimension(size.height), presetId: "responsive", isEnabled: true }); break; }
      case "browser-sidebar-browser-use-capture-surface": this.browserHost.setBrowserUseCaptureSurfaceSize?.(message.surfaceSize); break;
      case "browser-sidebar-tab-capture-state": this.browserHost.setTabCaptureActive?.(message.isActive === true); break;
      case "browser-sidebar-destroy-webview": if (this.browserHost.shouldDestroyForHostRequest?.(message)) { this.dispose(); window.postMessage({ type: "browser-sidebar-webview-destroyed", browserTabId: this.browserTabId, conversationId: this.conversationId, reason: message.reason, teardownId: message.teardownId }); void this.detachedWindows.close(); } break;
      case "browser-sidebar-usage": void this.toolbarService.recordBrowserNavigation?.({ initiator: message.initiator, panelTarget: this.request.content.data.panelTarget, source: message.source, urlKind: message.urlKind }); break;
      case "browser-sidebar-screenshot-copied": this.setStatusContent(getJsxRuntime().jsx("p", { role: "status", children: "Screenshot saved to clipboard" })); break;
      case "browser-sidebar-screenshot-copy-failed": this.reportError("Unable to capture screenshot"); break;
      default: if (typeof message.type === "string" && FORWARDED_ANNOTATION_MESSAGES.has(message.type)) void this.toolbarService.forwardBrowserAnnotationMessage?.(message);
    }
  };
  dispose(): void { if (this.disposed) return; this.disposed = true; this.setStatusContent(null); for (const disposable of this.disposables.splice(0).reverse()) disposable[Symbol.dispose](); this.root.unmount(); this.browserHost[Symbol.dispose]?.(); }
}

async function mountDetachedBrowserPage(request: DetachedBrowserRequest, appHost: AppHost, container: HTMLElement, renderLayout: (payload: LayoutPayload) => unknown, setChromeState: (update: unknown) => void, setStatusContent: (content: unknown) => void): Promise<DisposableLike> {
  const [browserHost, detachedWindows, , downloads] = await Promise.all([Promise.resolve(appHost.services.browserHost), Promise.resolve(appHost.services.detachedWindows), Promise.resolve(appHost.services.browserAutocomplete), Promise.resolve(appHost.services.downloads), Promise.resolve(appHost.services.browsingHistory)]);
  if (browserHost == null || detachedWindows == null) throw new Error("Detached Browser page services are unavailable");
  const toolbar = await detachedWindows.getToolbarService(); if (toolbar?.kind !== "browser") throw new Error("Detached Browser toolbar service is unavailable");
  const controller = new DetachedBrowserController(request, browserHost, detachedWindows, toolbar.service, downloads ?? null, container, renderLayout, setChromeState, setStatusContent);
  try { await controller.prepare(); } catch (error) { controller.dispose(); throw error; }
  return { [Symbol.dispose]: () => { controller.dispose(); asDisposable(toolbar.service)?.[Symbol.dispose](); asDisposable(downloads)?.[Symbol.dispose](); asDisposable(detachedWindows)?.[Symbol.dispose](); } };
}

initializeRuntime(); initializeShared(); initializeUi(); initializeOptions(); initializeAddressInput(); initializeBrowsingData();

export { mountDetachedBrowserPage };
