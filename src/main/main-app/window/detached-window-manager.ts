// 分离窗口（detached window）管理 + DeviceCheck cookie。
//
// 对应 main-C-Mhak1n.ts 81,190-82,018：
//   - GN PrewarmSlot：单窗口预热槽（entry 代数 + cancelled 标记 + destroyed 复检）
//   - qje DetachedWindowPrewarmer：预热器（2s 填充节流 + 30s 尝试超时 +
//     primary window 生命周期联动）
//   - Jje DetachedWindowManager：分离窗口状态机。phase 流转：
//       opening → presenting → detached ⇄ restoring → restored
//     open()：prewarm 复用或建窗 → receiver 握手（30s 兜底销毁）→ moveTab →
//     presenting → whenReady 后 show+focus → detached；
//     close 拦截（detached 时 preventDefault 并发起 restore）；
//     restore()：反向 moveTab（receiver.getContent → source.prepareRestore →
//     whenPrepared → moveTab → restored → 销毁分离窗）；
//     suspend/resumeSuspension：移动期间冻结源窗口（kind handler 注入）。
//     分析建议整类迁移不拆分。
//   - Yje DetachedWindowService：per-origin 门面
//   - Xje ThreadHandoffLease：handoff 租约（Symbol.dispose 释放）
//   - Qje DeviceCheckCookieManager：cookie 注册/变更监听/60s 过期缓冲 +
//     attachToken（x-sentinel-dc 头 + OAI-Package-Name 覆写）
//   - eMe CallIdClaimRegistry：callId 去重账本（1024 上限 FIFO）
import { BrowserWindow, session, net, screen } from "electron";
import { Uf as EventEmitterBase } from "@chunk/shared";
import { en as usingScopeHelper, yn as DETACHED_WINDOW_ROUTE } from "@chunk/bootstrap";

// ---------------------------------------------------------------------------
// PrewarmSlot（原 `GN`）
// ---------------------------------------------------------------------------

interface PrewarmEntry {
  cancelled: boolean;
  promise: Promise<BrowserWindow | null>;
  window: BrowserWindow | null;
}

function closeIfLive(window: BrowserWindow | null): void {
  if (window != null && !window.isDestroyed()) window.close();
}

/** 单窗口预热槽（原 `GN`）：entry 代数防竞态，destroyed 自动重建。 */
class PrewarmSlot {
  createWindow: () => Promise<BrowserWindow | null>;
  entry: PrewarmEntry | null = null;
  disposed = false;

  constructor(createWindow: PrewarmSlot["createWindow"]) {
    this.createWindow = createWindow;
  }

  async prewarm() {
    await this.get();
  }

  async get(): Promise<BrowserWindow | null> {
    if (this.disposed) return null;
    const entry = this.entry ?? this.createEntry();
    const window = await entry.promise;
    return this.disposed || entry.cancelled || window == null
      ? null
      : this.entry === entry
        ? window.isDestroyed()
          ? ((this.entry = null), this.get())
          : window
        : this.entry == null
          ? null
          : this.get();
  }

  /** 取走并清槽（原 `take`）：disposed 时关闭取到的窗口。 */
  async take(): Promise<BrowserWindow | null> {
    if (this.disposed) return null;
    const entry = this.entry ?? this.createEntry();
    this.entry = null;
    const window = await entry.promise;
    return this.disposed
      ? (closeIfLive(window), null)
      : window == null
        ? null
        : window.isDestroyed()
          ? this.createTakenWindow()
          : window;
  }

  /** 就绪窗口的同步取走（原 `takeReady`）。 */
  takeReady(): { window: BrowserWindow; request: { resolve(value: unknown): void } } | null {
    const window = this.peek();
    return this.disposed || window == null ? null : ((this.entry = null), window as never);
  }

  clear() {
    const entry = this.entry;
    this.entry = null;
    if (entry != null) {
      entry.cancelled = true;
      closeIfLive(entry.window);
      entry.window = null;
    }
  }

  dispose() {
    this.disposed = true;
    this.clear();
  }

  peek(): BrowserWindow | null {
    const window = this.entry?.window ?? null;
    return window?.isDestroyed() ? ((this.entry = null), null) : window;
  }

  runWhenAvailable(callback: (window: BrowserWindow) => void) {
    const entry = this.entry;
    entry?.promise
      .then((window) => {
        if (this.entry === entry && window != null && !window.isDestroyed()) callback(window);
      })
      .catch(() => void 0);
  }

  private createEntry(): PrewarmEntry {
    const entry: PrewarmEntry = {
      cancelled: false,
      promise: this.createWindow()
        .then((window) =>
          window == null
            ? (this.entry === entry && (this.entry = null), null)
            : entry.cancelled || this.disposed
              ? (closeIfLive(window), null)
              : ((entry.window = window), window),
        )
        .catch((error) => {
          throw (this.entry === entry && (this.entry = null), error);
        }),
      window: null,
    };
    this.entry = entry;
    return entry;
  }

  private async createTakenWindow(): Promise<BrowserWindow | null> {
    if (this.disposed) return null;
    const window = await this.createWindow();
    return window == null
      ? null
      : this.disposed
        ? (closeIfLive(window), null)
        : window.isDestroyed()
          ? this.createTakenWindow()
          : window;
  }
}

// ---------------------------------------------------------------------------
// DetachedWindowPrewarmer（原 `qje`）
// ---------------------------------------------------------------------------

const PREWARM_FILL_DELAY_MS = 2e3;
const PREWARM_ATTEMPT_TIMEOUT_MS = 3e4;

interface WindowManagerInterface {
  appQuitting: boolean;
  subscribePrimaryWindowChanges(cb: (window: BrowserWindow | null) => void): () => void;
  getPrimaryWindows(): BrowserWindow[];
  markWebContentsReady(webContents: Electron.WebContents): void;
  createWindow(options: Record<string, unknown>): Promise<BrowserWindow>;
  showWindow(window: BrowserWindow, opts: { stealFocus: boolean }): boolean;
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
}

interface PrewarmAttempt {
  window: BrowserWindow | null;
  ready: Deferred<boolean>;
  request: Deferred<unknown>;
  disposeListeners(): void;
}

/** 分离窗口预热器（原 `qje`）。 */
class DetachedWindowPrewarmer {
  windowManager: WindowManagerInterface;
  enabled = false;
  unsubscribePrimaryWindows: (() => void) | null = null;
  attempt: PrewarmAttempt | null = null;
  fillTimer: ReturnType<typeof setTimeout> | null = null;
  slot = new PrewarmSlot(() => this.createWindow());

  constructor(windowManager: WindowManagerInterface) {
    this.windowManager = windowManager;
  }

  start(origin: Electron.WebContents) {
    if (this.windowManager.appQuitting || !this.isLivePrimary(origin) || this.enabled) return;
    this.enabled = true;
    const unsubscribe = this.windowManager.subscribePrimaryWindowChanges((window) => {
      if (window == null) this.clear();
    });
    if (!this.enabled) {
      unsubscribe();
      return;
    }
    this.unsubscribePrimaryWindows = unsubscribe;
    this.scheduleFill();
  }

  clear() {
    this.enabled = false;
    this.unsubscribePrimaryWindows?.();
    this.unsubscribePrimaryWindows = null;
    this.cancelFill();
  }

  /** 取走就绪的预热窗口（原 `takeReady`）：成功时返回 attempt。 */
  takeReady(origin: Electron.WebContents): PrewarmAttempt | null {
    if (!this.enabled || !this.isLivePrimary(origin)) return null;
    if (this.slot.takeReady() == null) return (this.cancelFill(), null);
    const attempt = this.attempt;
    this.attempt = null;
    attempt?.disposeListeners();
    return attempt;
  }

  afterDetach() {
    if (this.enabled && this.windowManager.getPrimaryWindows().length > 0) this.scheduleFill();
  }

  /** 预热窗口的 webContents 就绪回调（原 `waitForRequest`）。 */
  waitForRequest(webContents: Electron.WebContents): Promise<unknown> {
    const attempt = this.attempt;
    return attempt?.window?.webContents === webContents
      ? (this.windowManager.markWebContentsReady(webContents), attempt.ready.resolve(true), attempt.request.promise)
      : Promise.resolve(null);
  }

  isWaitingForRequest(webContentsId: number): boolean {
    return this.attempt?.window?.webContents.id === webContentsId;
  }

  private scheduleFill() {
    if (this.fillTimer != null) clearTimeout(this.fillTimer);
    if (this.attempt != null || this.slot.peek() != null) {
      this.fillTimer = null;
      return;
    }
    this.fillTimer = setTimeout(() => {
      this.fillTimer = null;
      if (this.enabled && !this.windowManager.appQuitting) this.slot.prewarm().catch(() => {});
    }, PREWARM_FILL_DELAY_MS);
  }

  private cancelFill() {
    if (this.fillTimer != null) {
      clearTimeout(this.fillTimer);
      this.fillTimer = null;
    }
    const attempt = this.attempt;
    this.attempt = null;
    attempt?.ready.resolve(false);
    attempt?.request.resolve(null);
    attempt?.disposeListeners();
    if (attempt?.window != null && !attempt.window.isDestroyed()) attempt.window.destroy();
    this.slot.clear();
  }

  private async createWindow(): Promise<BrowserWindow | null> {
    if (!this.enabled || this.windowManager.appQuitting) return null;
    const attempt: PrewarmAttempt = {
      window: null,
      ready: Promise.withResolvers<boolean>(),
      request: Promise.withResolvers<unknown>(),
      disposeListeners: () => {},
    };
    this.attempt = attempt;
    const onFailed = () => {
      if (this.attempt === attempt) this.cancelFill();
    };
    const timeout = setTimeout(onFailed, PREWARM_ATTEMPT_TIMEOUT_MS);
    attempt.disposeListeners = () => clearTimeout(timeout);
    this.windowManager
      .createWindow({
        appearance: "detached",
        initialRoute: DETACHED_WINDOW_ROUTE,
        title: "",
        lockTitle: true,
        show: false,
        width: 960,
        height: 720,
        onCreated: (window: BrowserWindow) => {
          if (this.attempt !== attempt) {
            window.destroy();
            return;
          }
          (attempt as { window: BrowserWindow | null }).window = window;
          window.once("closed", onFailed);
          window.webContents.once("render-process-gone", onFailed);
          window.webContents.once("unresponsive", onFailed);
          attempt.disposeListeners = () => {
            clearTimeout(timeout);
            window.removeListener("closed", onFailed);
            window.webContents.removeListener("render-process-gone", onFailed);
            window.webContents.removeListener("unresponsive", onFailed);
          };
        },
      })
      .catch(onFailed);
    const ready = await attempt.ready.promise;
    return (clearTimeout(timeout), ready && this.attempt === attempt ? attempt.window : null);
  }

  private isLivePrimary(origin: Electron.WebContents): boolean {
    return this.windowManager
      .getPrimaryWindows()
      .some((window) => window.webContents === origin && !window.isDestroyed());
  }
}

// ---------------------------------------------------------------------------
// DetachedWindowManager（原 `Jje`）
// ---------------------------------------------------------------------------

type DetachedPhase = "opening" | "presenting" | "detached" | "restoring" | "restored";

interface DetachedRequest {
  sourceThreadId: string | null;
  sourceConversationId: string | null;
  tabId: string;
  title: string;
  content: { kind: string; data: unknown };
  chrome: unknown;
  toolbarState: { kind: string };
}

interface DetachedSource {
  dup(): DetachedSource;
  moved(): Promise<void>;
  focus(): Promise<void>;
  prepareRestore(content: unknown): Promise<PreparedReceiver>;
  updateTab(tabId: string, update: unknown): Promise<void>;
  restoreFinished(result: string): Promise<void>;
  closed(): Promise<void>;
  [Symbol.dispose](): void;
}

interface DetachedReceiver {
  whenPrepared(): Promise<boolean>;
  whenReady(): Promise<boolean>;
  getContent(): Promise<unknown>;
  [Symbol.dispose](): void;
}

interface PreparedReceiver {
  whenPrepared(): Promise<boolean>;
  whenReady(): Promise<boolean>;
  [Symbol.dispose](): void;
}

interface RpcPort {
  dup(): RpcPort;
  [Symbol.dispose](): void;
}

interface DetachedEntry {
  request: DetachedRequest;
  sourceWindow: BrowserWindow;
  window: BrowserWindow;
  webContentsId: number;
  source: DetachedSource;
  receiver: DetachedReceiver | null;
  setChromeState: RpcPort | null;
  receiverReady: { promise: Promise<DetachedReceiver | null>; resolve(value: DetachedReceiver | null): void };
  closed: { promise: Promise<boolean>; resolve(value: boolean): void };
  abort: AbortController;
  phase: DetachedPhase;
  sourceLost: boolean;
  disposeSourceListeners(): void;
  restoreAlwaysOnTopOnFocus: (() => void) | null;
  resumeSuspension: (() => void) | null;
}

interface DetachedKindHandlers {
  [kind: string]: {
    move(context: { content: unknown; sourceWindow: BrowserWindow; destinationWindow: BrowserWindow; receiver: unknown; signal: AbortSignal }): Promise<string>;
    suspend(context: unknown): () => void;
    close(context: { content: unknown; destinationWindow: BrowserWindow }): void;
    createToolbarService(context: unknown): unknown;
  };
}

/** 分离窗口管理器（原 `Jje`）：open/restore 双向 moveTab 状态机。 */
class DetachedWindowManager {
  windowManager: WindowManagerInterface;
  handlers: DetachedKindHandlers;
  windows = new Map<number, DetachedEntry>();
  handoffs = new Map<ThreadHandoffLease, string>();
  prewarm: DetachedWindowPrewarmer;

  constructor(windowManager: WindowManagerInterface, handlers: DetachedKindHandlers) {
    this.windowManager = windowManager;
    this.handlers = handlers;
    this.prewarm = new DetachedWindowPrewarmer(windowManager);
  }

  startPrewarming(origin: Electron.WebContents) {
    this.prewarm.start(origin);
  }

  clearPrewarm() {
    this.prewarm.clear();
  }

  createService(origin: Electron.WebContents) {
    return new DetachedWindowService(this, origin);
  }

  async getToolbarService(webContents: Electron.WebContents) {
    const entry = this.windows.get(webContents.id);
    return entry == null || !this.isActive(entry, true)
      ? null
      : this.handlers[entry.request.content.kind].createToolbarService(this.createContext(entry));
  }

  findForSource(webContents: Electron.WebContents, predicate: (request: DetachedRequest) => boolean) {
    for (const entry of this.windows.values())
      if (entry.sourceWindow.webContents === webContents && this.isActive(entry) && predicate(entry.request))
        return this.createContext(entry);
    return null;
  }

  /** 线程 handoff（原 `beginThreadHandoff`）：已有分离窗时返回策略提示。 */
  beginThreadHandoff(conversationId: string): ThreadHandoffLease | "restoreDetachedTabs" | "unboundDraft" {
    for (const { request } of this.windows.values()) {
      if (request.sourceConversationId === conversationId) return "restoreDetachedTabs";
      if (request.sourceConversationId === null) return "unboundDraft";
    }
    const lease = new ThreadHandoffLease(() => this.handoffs.delete(lease));
    this.handoffs.set(lease, conversationId);
    return lease;
  }

  bindSourceConversation(webContents: Electron.WebContents, sourceThreadId: string, conversationId: string) {
    for (const entry of this.windows.values())
      if (entry.sourceWindow.webContents === webContents && entry.request.sourceThreadId === sourceThreadId)
        entry.request.sourceConversationId = conversationId;
  }

  /** 分离（原 `open`）：phase opening → presenting → detached。 */
  async open(
    origin: Electron.WebContents,
    request: DetachedRequest,
    source: DetachedSource,
  ): Promise<"moved" | "not-moved" | "closed"> {
    const sourceWindow = BrowserWindow.fromWebContents(origin);
    if (
      sourceWindow == null ||
      sourceWindow.isDestroyed() ||
      request.toolbarState.kind !== request.content.kind ||
      [...this.handoffs.values()].some(
        (conversationId) => request.sourceConversationId === null || request.sourceConversationId === conversationId,
      ) ||
      this.windows.has(origin.id) ||
      this.find(origin, request.sourceThreadId, request.tabId) != null
    )
      return "not-moved";
    const abort = new AbortController();
    let entry: DetachedEntry | null = null;
    const onSourceLost = () => {
      if (entry != null) entry.sourceLost = true;
      abort.abort();
      if (entry != null && !entry.window.isDestroyed()) entry.window.destroy();
    };
    const onNavigation = (_event: unknown, url: string, isInPlace: boolean, isMainFrame: boolean) => {
      if (isMainFrame && !isInPlace) onSourceLost();
    };
    sourceWindow.once("closed", onSourceLost);
    origin.once("render-process-gone", onSourceLost);
    origin.on("did-start-navigation", onNavigation as never);
    const disposeSourceListeners = () => {
      sourceWindow.removeListener("closed", onSourceLost);
      origin.removeListener("render-process-gone", onSourceLost);
      origin.removeListener("did-start-navigation", onNavigation as never);
    };
    const created = Promise.withResolvers<DetachedEntry>();
    let prewarmed: PrewarmAttempt | null = null;
    try {
      const cursorPoint = screen.getCursorScreenPoint();
      const workArea = screen.getDisplayNearestPoint(cursorPoint).workArea;
      const sourceBounds = sourceWindow.getBounds();
      const onCreated = (window: BrowserWindow) => {
        const newEntry: DetachedEntry = {
          request,
          sourceWindow,
          window,
          webContentsId: window.webContents.id,
          source: source.dup(),
          receiver: null,
          setChromeState: null,
          receiverReady: Promise.withResolvers(),
          closed: Promise.withResolvers(),
          abort,
          phase: "opening",
          sourceLost: abort.signal.aborted,
          disposeSourceListeners,
          restoreAlwaysOnTopOnFocus: null,
          resumeSuspension: null,
        };
        entry = newEntry;
        this.windows.set(newEntry.webContentsId, newEntry);
        window.on("close", (event) => {
          if (
            event.defaultPrevented ||
            newEntry.sourceLost ||
            this.windowManager.appQuitting ||
            newEntry.phase === "opening" ||
            newEntry.phase === "restored"
          )
            return;
          // detached 状态下拦截关闭：转为 restore（原 close 拦截语义）。
          event.preventDefault();
          if (newEntry.phase === "detached") void this.restore(origin, request.sourceThreadId, request.tabId);
        });
        window.once("closed", () => {
          abort.abort();
          newEntry.receiverReady.resolve(null);
          newEntry.closed.resolve(false);
          if (newEntry.phase === "detached" || newEntry.phase === "restored") this.dispose(newEntry);
        });
        window.webContents.once("render-process-gone", () => {
          if (!window.isDestroyed()) {
            this.suspend(newEntry);
            window.destroy();
          }
        });
        created.resolve(newEntry);
        if (abort.signal.aborted) window.destroy();
      };
      const bounds = {
        width: Math.min(960, sourceBounds.width, Math.round(workArea.width * 0.8)),
        height: Math.min(720, sourceBounds.height, Math.round(workArea.height * 0.8)),
      };
      prewarmed = this.prewarm.takeReady(origin);
      if (prewarmed?.window == null) {
        this.windowManager
          .createWindow({
            appearance: "detached",
            initialRoute: DETACHED_WINDOW_ROUTE,
            title: request.title,
            lockTitle: true,
            show: false,
            ...bounds,
            onCreated,
          })
          .catch((error) => {
            created.reject(error);
            if (entry != null && !entry.window.isDestroyed()) entry.window.destroy();
          });
      } else {
        onCreated(prewarmed.window);
        prewarmed.window.setTitle(request.title);
        prewarmed.window.setBounds(bounds);
      }
      const detached = await created.promise;
      const window = detached.window;
      if (abort.signal.aborted || sourceWindow.isDestroyed())
        return (
          window.isDestroyed() || window.destroy(),
          this.dispose(detached),
          sourceWindow.isDestroyed() ? "closed" : "not-moved"
        );
      const windowBounds = window.getBounds();
      window.setBounds({
        x: Math.max(workArea.x, Math.min(cursorPoint.x, workArea.x + workArea.width - windowBounds.width)),
        y: Math.max(workArea.y, Math.min(cursorPoint.y, workArea.y + workArea.height - windowBounds.height)),
      });
      prewarmed?.request.resolve(request);
      // receiver 握手兜底：30s 内未就绪即销毁（防悬挂窗口）。
      const handshakeTimeout = setTimeout(() => {
        if (!window.isDestroyed()) window.destroy();
      }, 3e4);
      try {
        const receiver = await detached.receiverReady.promise;
        if (
          receiver == null ||
          abort.signal.aborted ||
          !(await Promise.race([receiver.whenPrepared(), detached.closed.promise]))
        )
          return "not-moved";
        const result = await this.moveTab({
          content: request.content as unknown,
          sourceWindow,
          destinationWindow: window,
          receiver,
          signal: abort.signal,
        });
        return result === "moved"
          ? ((detached.phase = "presenting"),
            detached.source.moved().catch(() => {}),
            (await Promise.race([
              receiver.whenReady().then(
                () => true,
                () => false,
              ),
              detached.closed.promise,
            ])) && !abort.signal.aborted && !window.isDestroyed()
              ? (window.show(), window.focus())
              : window.isDestroyed() || window.destroy(),
            "moved")
          : (result as "moved" | "not-moved" | "closed");
      } finally {
        clearTimeout(handshakeTimeout);
        if (detached.phase === "presenting") detached.phase = "detached";
        if (detached.phase === "opening" && !window.isDestroyed()) window.destroy();
        if (window.isDestroyed()) this.dispose(detached);
      }
    } catch {
      if (entry != null) {
        const failed = entry;
        return (
          failed.window.isDestroyed() || failed.window.destroy(),
          this.dispose(failed),
          failed.phase === "opening" ? "not-moved" : "moved"
        );
      }
      return "not-moved";
    } finally {
      prewarmed?.request.resolve(null);
      entry ?? disposeSourceListeners();
      this.prewarm.afterDetach();
    }
  }

  getRequest(webContents: Electron.WebContents): DetachedRequest | null {
    return this.windows.get(webContents.id)?.request ?? null;
  }

  getContentKind(webContents: Electron.WebContents): string | null {
    const request = this.getRequest(webContents);
    return request == null
      ? this.prewarm.isWaitingForRequest(webContents.id)
        ? "browser"
        : null
      : request.content.kind;
  }

  isDetachedViewer(webContentsId: number): boolean {
    return this.windows.has(webContentsId) || this.prewarm.isWaitingForRequest(webContentsId);
  }

  waitForRequest(webContents: Electron.WebContents): Promise<DetachedRequest | null> {
    return Promise.resolve(this.getRequest(webContents) ?? (this.prewarm.waitForRequest(webContents) as Promise<DetachedRequest | null>));
  }

  setReceiver(webContents: Electron.WebContents, receiver: RpcPort & DetachedReceiver, setChromeState: RpcPort): boolean {
    const entry = this.windows.get(webContents.id);
    return entry == null || entry.receiver != null || entry.abort.signal.aborted
      ? false
      : ((entry.receiver = receiver.dup() as unknown as DetachedReceiver),
        (entry.setChromeState = setChromeState.dup()),
        this.publishChromeState(entry),
        this.windowManager.markWebContentsReady(webContents),
        entry.receiverReady.resolve(receiver),
        true);
  }

  focus(webContents: Electron.WebContents, sourceThreadId: string | null, tabId: string): boolean {
    const entry = this.find(webContents, sourceThreadId, tabId);
    return entry == null || entry.phase === "opening" || entry.window.isDestroyed()
      ? false
      : (entry.window.show(), entry.window.focus(), true);
  }

  /** 聚焦源窗口（原 `focusSource`）：30s 兜底 + using-scope。 */
  async focusSource(webContents: Electron.WebContents): Promise<boolean> {
    const entry = this.windows.get(webContents.id);
    if (entry?.phase !== "detached" || entry.sourceLost || entry.sourceWindow.isDestroyed()) return false;
    const fallback = Promise.withResolvers<boolean>();
    const onAbort = () => fallback.resolve(false);
    const timeout = setTimeout(onAbort, 3e4);
    entry.abort.signal.addEventListener("abort", onAbort, { once: true });
    try {
      const scope = usingScopeHelper() as unknown as { u(value: unknown): Promise<unknown>; e: unknown; d(): void };
      try {
        if (!this.windowManager.showWindow(entry.sourceWindow, { stealFocus: true })) return false;
        const focused = scope.u(entry.source.focus());
        return (await Promise.race([focused, fallback.promise])) === true;
      } catch (error) {
        scope.e = error;
      } finally {
        scope.d();
      }
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
      entry.abort.signal.removeEventListener("abort", onAbort);
    }
  }

  setAlwaysOnTop(webContents: Electron.WebContents, alwaysOnTop: boolean): boolean {
    const entry = this.windows.get(webContents.id);
    return entry == null || entry.window.isDestroyed() || !(BrowserWindow as unknown as { isAlwaysOnTopSupported(): boolean }).isAlwaysOnTopSupported()
      ? false
      : (entry.restoreAlwaysOnTopOnFocus != null &&
          (entry.window.removeListener("focus", entry.restoreAlwaysOnTopOnFocus),
          (entry.restoreAlwaysOnTopOnFocus = null)),
        entry.window.setAlwaysOnTop(alwaysOnTop),
        this.publishChromeState(entry),
        entry.window.isAlwaysOnTop() === alwaysOnTop);
  }

  /** 回迁（原 `restore`）：phase detached → restoring → restored。 */
  async restore(webContents: Electron.WebContents, sourceThreadId: string | null, tabId: string): Promise<"moved" | "not-moved" | "closed"> {
    const entry = this.find(webContents, sourceThreadId, tabId);
    if (entry?.phase !== "detached" || entry.abort.signal.aborted || entry.receiver == null)
      return "not-moved";
    entry.phase = "restoring";
    this.suspend(entry);
    const abort = new AbortController();
    const fallback = Promise.withResolvers<unknown>();
    const onAbort = () => {
      abort.abort();
      fallback.resolve(null);
    };
    entry.abort.signal.addEventListener("abort", onAbort, { once: true });
    const timeout = setTimeout(onAbort, 3e4);
    let result: "moved" | "not-moved" | "closed" = "not-moved";
    try {
      const scope = usingScopeHelper() as unknown as { u(value: unknown): Promise<unknown>; e: unknown; d(): void };
      try {
        this.windowManager.showWindow(entry.sourceWindow, { stealFocus: true });
        const content = await Promise.race([entry.receiver.getContent(), fallback.promise]);
        if (content == null || abort.signal.aborted) return result;
        const prepared = scope.u(entry.source.prepareRestore(content));
        const receiver = await Promise.race([prepared, fallback.promise]);
        if (
          receiver == null ||
          !(await Promise.race([(receiver as PreparedReceiver).whenPrepared(), fallback.promise])) ||
          abort.signal.aborted
        )
          return result;
        result = (await this.moveTab({
          content,
          sourceWindow: entry.window,
          destinationWindow: entry.sourceWindow,
          receiver,
          signal: abort.signal,
        })) as "moved" | "not-moved" | "closed";
        if (result === "moved") {
          entry.phase = "restored";
          await Promise.race([(receiver as PreparedReceiver).whenReady(), fallback.promise]);
          if (!abort.signal.aborted && !entry.sourceWindow.isDestroyed()) {
            entry.sourceWindow.show();
            entry.sourceWindow.focus();
          }
        }
        return result;
      } catch (error) {
        scope.e = error;
      } finally {
        scope.d();
      }
    } catch {
      return result;
    } finally {
      clearTimeout(timeout);
      entry.abort.signal.removeEventListener("abort", onAbort);
      entry.source.restoreFinished(result).catch(() => {});
      if (entry.phase === "restoring") entry.phase = "detached";
      if (entry.phase === "restored" || (result === "not-moved" && !entry.window.isDestroyed())) {
        entry.resumeSuspension?.();
        entry.resumeSuspension = null;
      }
      if ((entry.phase === "restored" || result === "closed") && !entry.window.isDestroyed()) entry.window.destroy();
      if (entry.window.isDestroyed()) this.dispose(entry);
    }
  }

  updateTab(webContents: Electron.WebContents, tabId: string, update: unknown) {
    const entry = this.windows.get(webContents.id);
    if (entry == null || entry.window.isDestroyed()) return;
    entry.source.updateTab(tabId, update).catch(() => {});
  }

  /** 显示源窗口（原 `revealSource`）：always-on-top 暂摘 + focus 恢复。 */
  async revealSource(entry: DetachedEntry, webContents: Electron.WebContents, focusSource: boolean): Promise<boolean> {
    const wasAlwaysOnTop = entry.window.isAlwaysOnTop();
    if (wasAlwaysOnTop) entry.window.setAlwaysOnTop(false);
    const revealed = focusSource
      ? await this.focusSource(webContents)
      : this.windowManager.showWindow(entry.sourceWindow, { stealFocus: true });
    const stillActive =
      this.windows.get(webContents.id) === entry &&
      entry.phase === "detached" &&
      !entry.sourceLost &&
      !entry.abort.signal.aborted &&
      !entry.window.isDestroyed() &&
      !entry.sourceWindow.isDestroyed();
    if (!revealed || !stillActive) {
      if (wasAlwaysOnTop && !entry.window.isDestroyed()) entry.window.setAlwaysOnTop(true);
      return false;
    }
    if (wasAlwaysOnTop) {
      entry.restoreAlwaysOnTopOnFocus = () => {
        entry.restoreAlwaysOnTopOnFocus = null;
        if (!entry.window.isDestroyed()) {
          entry.window.setAlwaysOnTop(true);
          this.publishChromeState(entry);
        }
      };
      entry.window.once("focus", entry.restoreAlwaysOnTopOnFocus);
    }
    return true;
  }

  setTitle(webContents: Electron.WebContents, sourceThreadId: string | null, tabId: string, title: string) {
    const entry = this.find(webContents, sourceThreadId, tabId);
    if (entry != null && !entry.window.isDestroyed()) {
      entry.request.title = title;
      entry.window.setTitle(title);
      this.publishChromeState(entry);
    }
  }

  setChrome(webContents: Electron.WebContents, sourceThreadId: string | null, tabId: string, chrome: unknown, toolbarState: { kind: string }) {
    const entry = this.find(webContents, sourceThreadId, tabId);
    if (entry != null && !entry.window.isDestroyed() && toolbarState.kind === entry.request.content.kind) {
      entry.request.chrome = chrome;
      entry.request.toolbarState = toolbarState;
      this.publishChromeState(entry);
    }
  }

  close(webContents: Electron.WebContents, ...rest: [string | null, string] | []) {
    const entry = rest.length === 0 ? this.windows.get(webContents.id) : this.find(webContents, rest[0], rest[1]);
    if (entry != null && !entry.window.isDestroyed()) {
      if (entry.phase === "detached" && !entry.sourceLost && !this.windowManager.appQuitting) {
        this.suspend(entry);
        this.handlers[entry.request.content.kind].close({
          content: entry.request.content.data,
          destinationWindow: entry.window,
        });
      }
      entry.window.destroy();
    }
  }

  moveTab(context: { content: unknown; sourceWindow: BrowserWindow; destinationWindow: BrowserWindow; receiver: unknown; signal: AbortSignal }): Promise<string> {
    const kind = (context.content as { kind: string }).kind;
    return this.handlers[kind].move({ ...context, content: (context.content as { data: unknown }).data });
  }

  publishChromeState(entry: DetachedEntry) {
    (entry.setChromeState as unknown as ((state: unknown) => Promise<void>) | null)?.({
      title: entry.request.title,
      chrome: entry.request.chrome,
      toolbarState: entry.request.toolbarState,
      alwaysOnTop: (BrowserWindow as unknown as { isAlwaysOnTopSupported(): boolean }).isAlwaysOnTopSupported()
        ? entry.restoreAlwaysOnTopOnFocus != null || entry.window.isAlwaysOnTop()
        : null,
    }).catch?.(() => {});
  }

  isActive(entry: DetachedEntry, includeTransitional = false): boolean {
    return (
      this.windows.get(entry.webContentsId) === entry &&
      (entry.phase === "detached" || (includeTransitional && (entry.phase === "opening" || entry.phase === "presenting"))) &&
      !entry.sourceLost &&
      !entry.abort.signal.aborted &&
      !entry.window.isDestroyed() &&
      !entry.sourceWindow.isDestroyed()
    );
  }

  createContext(entry: DetachedEntry) {
    return {
      get request() {
        return entry.request;
      },
      sourceWindow: entry.sourceWindow,
      window: entry.window,
      source: entry.source,
      signal: entry.abort.signal,
      get phase() {
        return entry.phase;
      },
      isActive: (includeTransitional: boolean) => this.isActive(entry, includeTransitional),
      revealSource: (focusSource: boolean) =>
        this.isActive(entry) ? this.revealSource(entry, entry.window.webContents, focusSource) : Promise.resolve(false),
    };
  }

  private find(webContents: Electron.WebContents, sourceThreadId: string | null, tabId: string): DetachedEntry | undefined {
    return [...this.windows.values()].find(
      (entry) =>
        !entry.sourceWindow.isDestroyed() &&
        entry.sourceWindow.webContents === webContents &&
        entry.request.sourceThreadId === sourceThreadId &&
        entry.request.tabId === tabId,
    );
  }

  private suspend(entry: DetachedEntry) {
    entry.resumeSuspension ??= this.handlers[entry.request.content.kind].suspend(this.createContext(entry));
  }

  private dispose(entry: DetachedEntry) {
    if (this.windows.get(entry.webContentsId) !== entry) return;
    if (entry.phase === "detached" || entry.phase === "restoring") this.suspend(entry);
    this.windows.delete(entry.webContentsId);
    if (entry.restoreAlwaysOnTopOnFocus != null) {
      entry.window.removeListener("focus", entry.restoreAlwaysOnTopOnFocus);
      entry.restoreAlwaysOnTopOnFocus = null;
    }
    entry.disposeSourceListeners();
    entry.receiver?.[Symbol.dispose]();
    (entry.setChromeState as unknown as DetachedReceiver | null)?.[Symbol.dispose]();
    if (
      entry.phase === "opening" ||
      entry.phase === "restored" ||
      this.windowManager.appQuitting ||
      entry.sourceLost ||
      entry.sourceWindow.isDestroyed()
    ) {
      entry.source[Symbol.dispose]();
      return;
    }
    entry.source
      .closed()
      .catch(() => {})
      .finally(() => entry.source[Symbol.dispose]());
  }
}

// ---------------------------------------------------------------------------
// DetachedWindowService（原 `Yje`）与 ThreadHandoffLease（原 `Xje`）
// ---------------------------------------------------------------------------

/** per-origin 门面（原 `Yje`）。 */
class DetachedWindowService extends (EventEmitterBase as new () => {}) {
  manager: DetachedWindowManager;
  origin: Electron.WebContents;

  constructor(manager: DetachedWindowManager, origin: Electron.WebContents) {
    super();
    this.manager = manager;
    this.origin = origin;
  }

  beginThreadHandoff(conversationId: string) {
    return this.manager.beginThreadHandoff(conversationId);
  }

  bindSourceConversation(sourceThreadId: string, conversationId: string) {
    this.manager.bindSourceConversation(this.origin, sourceThreadId, conversationId);
  }

  open(request: DetachedRequest, source: DetachedSource) {
    return this.manager.open(this.origin, request, source);
  }

  getRequest() {
    return this.manager.waitForRequest(this.origin);
  }

  getContentKind() {
    return this.manager.getContentKind(this.origin);
  }

  setReceiver(receiver: RpcPort & DetachedReceiver, setChromeState: RpcPort) {
    return this.manager.setReceiver(this.origin, receiver, setChromeState);
  }

  updateTab(tabId: string, update: unknown) {
    this.manager.updateTab(this.origin, tabId, update);
  }

  getToolbarService() {
    return this.manager.getToolbarService(this.origin);
  }

  setTitle(sourceThreadId: string | null, tabId: string, title: string) {
    this.manager.setTitle(this.origin, sourceThreadId, tabId, title);
  }

  setChrome(sourceThreadId: string | null, tabId: string, chrome: unknown, toolbarState: { kind: string }) {
    this.manager.setChrome(this.origin, sourceThreadId, tabId, chrome, toolbarState);
  }

  focus(sourceThreadId: string | null, tabId: string) {
    return this.manager.focus(this.origin, sourceThreadId, tabId);
  }

  focusSource() {
    return this.manager.focusSource(this.origin);
  }

  setAlwaysOnTop(alwaysOnTop: boolean) {
    return this.manager.setAlwaysOnTop(this.origin, alwaysOnTop);
  }

  restore(sourceThreadId: string | null, tabId: string) {
    return this.manager.restore(this.origin, sourceThreadId, tabId);
  }

  close(...rest: [string | null, string] | []) {
    this.manager.close(this.origin, ...rest);
  }
}

/** handoff 租约（原 `Xje`）。 */
class ThreadHandoffLease extends (EventEmitterBase as new () => {}) {
  release: () => void;

  constructor(release: () => void) {
    super();
    this.release = release;
  }

  [Symbol.dispose]() {
    this.release();
  }
}

// ---------------------------------------------------------------------------
// DeviceCheckCookieManager（原 `Qje`）与 CallIdClaimRegistry（原 `eMe`）
// ---------------------------------------------------------------------------

const DEVICECHECK_COOKIE_NAME = "_devicecheck";
/** cookie 过期安全缓冲（原 `Zje`）。 */
const COOKIE_EXPIRY_BUFFER_MS = 6e4;

interface DeviceCheckOptions {
  url: string;
  bundleIdentifier: string;
  generateToken(): Promise<string | null>;
}

/** DeviceCheck cookie 管理（原 `Qje`）：注册/变更监听/过期重注册。 */
class DeviceCheckCookieManager {
  options: DeviceCheckOptions;
  registration: Promise<void> | null = null;
  registeredCookie: Electron.Cookie | null = null;
  registeredDeviceId: string | null = null;

  constructor(options: DeviceCheckOptions) {
    this.options = options;
    session.defaultSession.cookies.on("changed", (_event, cookie, cause, removed) => {
      if (
        cookie.name === DEVICECHECK_COOKIE_NAME &&
        this.registeredCookie != null &&
        cookie.domain === this.registeredCookie.domain &&
        cookie.path === this.registeredCookie.path
      ) {
        if (removed) {
          if (cause === "overwrite") return;
          this.registeredCookie = null;
          this.registeredDeviceId = null;
          return;
        }
        this.registeredCookie = cookie;
      }
    });
  }

  /** 确保 cookie 存在且未临近过期（原 `ensureCookie`）。 */
  async ensureCookie(headers: Record<string, unknown>) {
    const deviceId = (headers["oai-did"] as string | undefined) ?? null;
    if (
      deviceId != null &&
      this.registeredDeviceId === deviceId &&
      this.registeredCookie != null &&
      (this.registeredCookie.expirationDate == null ||
        Date.now() + COOKIE_EXPIRY_BUFFER_MS < this.registeredCookie.expirationDate * 1e3)
    )
      return;
    if (this.registration != null) {
      await this.registration;
      return this.ensureCookie(headers);
    }
    const registration = this.registerCookie(headers)
      .then((cookie) => {
        this.registeredCookie = cookie;
        this.registeredDeviceId = deviceId;
      })
      .finally(() => {
        this.registration = null;
      });
    this.registration = registration;
    await registration;
  }

  /** 附加 sentinel token 头（原 `attachToken`）：OAI-Package-Name 覆写。 */
  async attachToken(headers: Record<string, unknown>) {
    const token = await this.options.generateToken();
    if (token == null) throw new Error("DeviceCheck token generation is unavailable");
    headers["x-sentinel-dc"] = JSON.stringify({ token });
    for (const key of Object.keys(headers))
      if (key.toLowerCase() === "oai-package-name") delete headers[key];
    headers["OAI-Package-Name"] = this.options.bundleIdentifier;
  }

  private async registerCookie(headers: Record<string, unknown>): Promise<Electron.Cookie> {
    const token = await this.options.generateToken();
    if (token == null) throw new Error("DeviceCheck token generation is unavailable");
    const response = await net.fetch(this.options.url, {
      body: JSON.stringify({ bundle_id: this.options.bundleIdentifier, device_token: token }),
      credentials: "include",
      headers: { ...headers, "Content-Type": "application/json" },
      method: "POST",
    });
    if (!response.ok) throw new Error(`DeviceCheck registration failed (${response.status})`);
    const [cookie] = await session.defaultSession.cookies.get({ name: DEVICECHECK_COOKIE_NAME, url: this.options.url });
    if (cookie == null) throw new Error("DeviceCheck registration returned no cookie");
    return cookie;
  }
}

const CLAIM_REGISTRY_LIMIT = 1024;

/** callId 去重账本（原 `eMe`）：1024 上限 FIFO。 */
class CallIdClaimRegistry extends (EventEmitterBase as new () => {}) {
  claimedCallKeys = new Set<string>();

  tryClaimExecution({ callId, hostId, threadId, turnId }: { callId: string; hostId: string; threadId: string; turnId: string }): boolean {
    const key = `${hostId}:${threadId}:${turnId}:${callId}`;
    if (this.claimedCallKeys.has(key)) return false;
    this.claimedCallKeys.add(key);
    if (this.claimedCallKeys.size > CLAIM_REGISTRY_LIMIT) {
      const oldest = this.claimedCallKeys.values().next().value;
      if (oldest != null) this.claimedCallKeys.delete(oldest);
    }
    return true;
  }
}

export {
  PrewarmSlot,
  DetachedWindowPrewarmer,
  DetachedWindowManager,
  DetachedWindowService,
  ThreadHandoffLease,
  DeviceCheckCookieManager,
  CallIdClaimRegistry,
  type DetachedRequest,
  type DetachedKindHandlers,
  type WindowManagerInterface,
};
