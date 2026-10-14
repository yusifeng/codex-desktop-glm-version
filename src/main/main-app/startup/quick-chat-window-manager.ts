type Logger = {
  warning(message: string, context: unknown): void;
};

type WebContentsLike = {
  id: number;
  isDestroyed(): boolean;
  once(event: "destroyed", listener: () => void): void;
  removeListener(event: "destroyed", listener: () => void): void;
};

type WindowLike = {
  webContents: WebContentsLike;
  close(): void;
  focus(): void;
  isDestroyed(): boolean;
  isMinimized(): boolean;
  once(event: "closed", listener: () => void): void;
  removeListener(event: "closed", listener: () => void): void;
  restore(): void;
  setPosition(x: number, y: number, animate: boolean): void;
  setSize(width: number, height: number, animate: boolean): void;
  show(): void;
};

type OriginWindowLike = WebContentsLike;

type LazyWindow<T> = {
  dispose(): void;
  peek(): T | null;
  prewarm(): Promise<void>;
  take(): Promise<T | null>;
};

type TimeoutHandle = ReturnType<typeof setTimeout> & { unref(): void };

type Bounds = { height: number; width: number; x: number; y: number };

type Prewarm = {
  claimedWindow: WindowLike | null;
  handleOriginDestroyed: () => void;
  loadingWindow: WindowLike | null;
  origin: OriginWindowLike;
  prewarmedWindow: LazyWindow<WindowLike>;
  released: boolean;
};

type PendingWindow = {
  conversationId: unknown;
  handleClosed: () => void;
  readyTimeout: TimeoutHandle;
  resolve(value: boolean): void;
  window: WindowLike;
};

export type QuickChatWindowManagerDependencies = {
  clearTimeout(handle: TimeoutHandle): void;
  createLazyWindow(factory: () => Promise<WindowLike | null>): LazyWindow<WindowLike>;
  createRoute(conversationId: unknown, contextSourceThread: unknown): string;
  getMatchingWorkArea(bounds: Bounds): Bounds;
  getOwnerWindow(origin: OriginWindowLike): { getContentBounds(): Bounds; isDestroyed(): boolean } | null;
  initialRoute: string;
  logger(): Logger;
  prewarmReadyTimeoutMs: number;
  quickChatHeight: number;
  quickChatWidth: number;
  routeReadyTimeoutMs: number;
  setTimeout(callback: () => void, delay: number): TimeoutHandle;
  windowManager: {
    createWindow(options: Record<string, unknown>): Promise<WindowLike>;
    getPrimaryWindow(): WindowLike | null | undefined;
    sendMessageToWindow(window: WindowLike, message: unknown): void;
  };
};

/** Owns Quick Chat window prewarming, route readiness, claiming, placement, and cleanup. */
export class QuickChatWindowManager {
  private readonly dependencies: QuickChatWindowManagerDependencies;
  private readonly claimedPrewarms = new Set<Prewarm>();
  private disposed = false;
  private readonly pendingWindows = new Map<number, PendingWindow>();
  private readonly prewarmedRendererReadyIds = new Set<number>();
  private readonly prewarms = new Map<number, Prewarm>();

  constructor(dependencies: QuickChatWindowManagerDependencies) {
    this.dependencies = dependencies;
  }

  addToComposer(payload: Record<string, unknown>): Promise<void> {
    const primaryWindow = this.dependencies.windowManager.getPrimaryWindow();
    if (primaryWindow == null) throw Error("No primary app window is available");
    this.dependencies.windowManager.sendMessageToWindow(primaryWindow, {
      type: "add-quick-chat-to-codex",
      ...payload,
    });
    return Promise.resolve();
  }

  prewarm(origin: OriginWindowLike): void {
    if (this.disposed) return;
    this.getPrewarm(origin)?.prewarmedWindow.prewarm().catch((error) => {
      this.dependencies.logger().warning("Failed to prewarm Quick Chat window", {
        safe: {},
        sensitive: { error },
      });
    });
  }

  clearPrewarm(origin: OriginWindowLike): void {
    const prewarm = this.prewarms.get(origin.id);
    if (prewarm?.origin === origin) this.disposePrewarm(prewarm);
  }

  async open(
    origin: OriginWindowLike,
    conversationId: unknown,
    contextSourceThread: unknown,
    popoverBounds: Bounds,
  ): Promise<void> {
    const prewarm = this.getPrewarm(origin);
    if (prewarm == null) return;
    this.prewarms.delete(origin.id);
    this.claimedPrewarms.add(prewarm);
    let opened = false;
    try {
      const window = await prewarm.prewarmedWindow.take();
      if (window == null) return;
      prewarm.claimedWindow = window;
      this.prewarmedRendererReadyIds.delete(window.webContents.id);
      this.positionWindow(window, origin, popoverBounds);
      const routeReady = this.waitForRoute(
        window,
        conversationId,
        this.dependencies.routeReadyTimeoutMs,
      );
      this.dependencies.windowManager.sendMessageToWindow(window, {
        type: "navigate-to-route",
        path: this.dependencies.createRoute(conversationId, contextSourceThread),
        persistForReload: true,
      });
      if (!(await routeReady) || window.isDestroyed()) return;
      if (window.isMinimized()) window.restore();
      window.show();
      window.focus();
      opened = true;
    } finally {
      if (opened) this.completePrewarmClaim(prewarm);
      else this.disposePrewarm(prewarm);
    }
  }

  handleRendererReady(origin: OriginWindowLike, conversationId: unknown): void {
    if (this.disposed) return;
    if (this.pendingWindows.get(origin.id)?.conversationId === conversationId) {
      this.finishPendingWindow(origin.id, true);
      return;
    }
    if (conversationId == null) this.prewarmedRendererReadyIds.add(origin.id);
    else this.prewarmedRendererReadyIds.delete(origin.id);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const prewarm of this.prewarms.values()) this.disposePrewarm(prewarm);
    for (const prewarm of this.claimedPrewarms) this.disposePrewarm(prewarm);
    for (const [id, pending] of this.pendingWindows) {
      this.finishPendingWindow(id, false);
      if (!pending.window.isDestroyed()) pending.window.close();
    }
    this.prewarmedRendererReadyIds.clear();
  }

  private getPrewarm(origin: OriginWindowLike): Prewarm | null {
    if (this.disposed) return null;
    const existing = this.prewarms.get(origin.id);
    if (existing?.origin === origin) return existing;
    if (existing != null) this.disposePrewarm(existing);
    if (origin.isDestroyed()) return null;

    let prewarm: Prewarm;
    const handleOriginDestroyed = () => {
      this.disposePrewarm(prewarm);
    };
    prewarm = {
      claimedWindow: null,
      handleOriginDestroyed,
      loadingWindow: null,
      origin,
      prewarmedWindow: this.dependencies.createLazyWindow(async () => {
        const window = await this.dependencies.windowManager.createWindow({
          title: "ChatGPT",
          width: this.dependencies.quickChatWidth,
          height: this.dependencies.quickChatHeight,
          appearance: "quickChat",
          show: false,
          initialRoute: this.dependencies.initialRoute,
          lockTitle: true,
        });
        if (prewarm.released) {
          this.prewarmedRendererReadyIds.delete(window.webContents.id);
          if (!window.isDestroyed()) window.close();
          return null;
        }
        prewarm.loadingWindow = window;
        const ready = await this.waitForRoute(
          window,
          null,
          this.dependencies.prewarmReadyTimeoutMs,
        );
        prewarm.loadingWindow = null;
        return ready ? window : null;
      }),
      released: false,
    };
    this.prewarms.set(origin.id, prewarm);
    origin.once("destroyed", handleOriginDestroyed);
    return prewarm;
  }

  private disposePrewarm(prewarm: Prewarm): void {
    if (this.prewarms.get(prewarm.origin.id) === prewarm) {
      this.prewarms.delete(prewarm.origin.id);
    }
    const window =
      prewarm.claimedWindow ?? prewarm.loadingWindow ?? prewarm.prewarmedWindow.peek();
    this.completePrewarmClaim(prewarm);
    if (window != null) {
      this.finishPendingWindow(window.webContents.id, false);
      if (!window.isDestroyed()) window.close();
    }
  }

  private completePrewarmClaim(prewarm: Prewarm): void {
    this.claimedPrewarms.delete(prewarm);
    prewarm.released = true;
    prewarm.origin.removeListener("destroyed", prewarm.handleOriginDestroyed);
    prewarm.prewarmedWindow.dispose();
    prewarm.claimedWindow = null;
    prewarm.loadingWindow = null;
  }

  private waitForRoute(
    window: WindowLike,
    conversationId: unknown,
    timeoutMs: number,
  ): Promise<boolean> {
    const id = window.webContents.id;
    if (conversationId == null && this.prewarmedRendererReadyIds.delete(id)) {
      return Promise.resolve(true);
    }
    return new Promise((resolve) => {
      const handleClosed = () => {
        this.finishPendingWindow(id, false);
      };
      const readyTimeout = this.dependencies.setTimeout(() => {
        const pending = this.finishPendingWindow(id, false);
        if (pending != null && !pending.window.isDestroyed()) pending.window.close();
      }, timeoutMs);
      readyTimeout.unref();
      window.once("closed", handleClosed);
      this.pendingWindows.set(id, {
        conversationId,
        handleClosed,
        readyTimeout,
        resolve,
        window,
      });
    });
  }

  private finishPendingWindow(id: number, ready: boolean): PendingWindow | null {
    this.prewarmedRendererReadyIds.delete(id);
    const pending = this.pendingWindows.get(id);
    if (pending == null) return null;
    this.pendingWindows.delete(id);
    this.dependencies.clearTimeout(pending.readyTimeout);
    if (!pending.window.isDestroyed()) {
      pending.window.removeListener("closed", pending.handleClosed);
    }
    pending.resolve(ready);
    return pending;
  }

  private positionWindow(
    window: WindowLike,
    origin: OriginWindowLike,
    popoverBounds: Bounds,
  ): void {
    const owner = this.dependencies.getOwnerWindow(origin);
    if (owner == null || owner.isDestroyed()) return;
    const ownerBounds = owner.getContentBounds();
    const absoluteBounds = {
      height: popoverBounds.height,
      width: popoverBounds.width,
      x: ownerBounds.x + popoverBounds.x,
      y: ownerBounds.y + popoverBounds.y,
    };
    const workArea = this.dependencies.getMatchingWorkArea(absoluteBounds);
    const width = Math.max(400, Math.min(this.dependencies.quickChatWidth, workArea.width));
    const height = Math.max(400, Math.min(this.dependencies.quickChatHeight, workArea.height));
    if (
      width !== this.dependencies.quickChatWidth ||
      height !== this.dependencies.quickChatHeight
    ) {
      window.setSize(width, height, false);
    }
    const desiredX = Math.round(absoluteBounds.x + absoluteBounds.width - width);
    const desiredY = Math.round(absoluteBounds.y + absoluteBounds.height - height);
    window.setPosition(
      Math.max(workArea.x, Math.min(desiredX, workArea.x + workArea.width - width)),
      Math.max(workArea.y, Math.min(desiredY, workArea.y + workArea.height - height)),
      false,
    );
  }
}

if (typeof module !== "undefined") module.exports = { QuickChatWindowManager };
