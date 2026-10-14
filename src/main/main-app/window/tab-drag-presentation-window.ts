const PRESENTATION_DOCUMENT = `data:text/html;charset=utf-8,%3C!doctype%20html%3E%3Cmeta%20charset%3D%22utf-8%22%3E%3Cmeta%20http-equiv%3D%22Content-Security-Policy%22%20content%3D%22default-src%20'none'%3B%20img-src%20data%3A%20https%3A%20http%3A%3B%20style-src%20'unsafe-inline'%22%3E%3Cstyle%3Ehtml%2Cbody%7Bmargin%3A0%3Bwidth%3A100%25%3Bheight%3A100%25%3Boverflow%3Ahidden%3Bbackground%3Atransparent%7D%23card%7Bposition%3Arelative%3Bwidth%3A100%25%3Bheight%3A100%25%3Boverflow%3Ahidden%7D%23snapshot%7Btransform-origin%3Atop%20left%7D%3C%2Fstyle%3E%3Cdiv%20id%3D%22card%22%3E%3Cdiv%20id%3D%22snapshot%22%3E%3C%2Fdiv%3E%3C%2Fdiv%3E`;

type Point = { x: number; y: number };
type TimeoutHandle = ReturnType<typeof setTimeout>;
type IntervalHandle = ReturnType<typeof setInterval>;

type PresentationWindow = {
  webContents: {
    capturePage(): Promise<{ isEmpty(): boolean }>;
    executeJavaScriptInIsolatedWorld(worldId: number, scripts: Array<{ code: string }>): Promise<unknown>;
  };
  destroy(): void;
  isDestroyed(): boolean;
  isVisible(): boolean;
  loadURL(url: string): Promise<unknown>;
  off(event: "closed", listener: () => void): void;
  on(event: "closed", listener: () => void): void;
  setIgnoreMouseEvents(ignore: boolean): void;
  setOpacity(opacity: number): void;
  setPosition(x: number, y: number): void;
  setSize(width: number, height: number): void;
  setVisibleOnAllWorkspaces(visible: boolean): void;
  showInactive(): void;
};

export type TabDragPresentationWindowDependencies = {
  clearInterval(handle: IntervalHandle): void;
  clearTimeout(handle: TimeoutHandle | undefined): void;
  createWindow(options: Record<string, unknown>): PresentationWindow;
  getCursorScreenPoint(): Point;
  isDarwin: boolean;
  operationTimeoutMs: number;
  setInterval(callback: () => void, delay: number): IntervalHandle;
  setTimeout(callback: () => void, delay: number): TimeoutHandle;
};

export type TabDragPresentationLoad = {
  borderRadius: number;
  grabOffset: Point;
  markup: string;
  size: { height: number; width: number };
  zoom: number;
};

/** Owns the isolated transparent window used while detaching an app-shell tab. */
export class TabDragPresentationWindow {
  private readonly dependencies: TabDragPresentationWindowDependencies;
  private readonly window: PresentationWindow;
  private disposed = false;
  private frozenPointer: Point | null = null;
  private readonly readyPromise: Promise<boolean>;
  private loadPromise: Promise<boolean> | null = null;
  private cuePromise = Promise.resolve(true);
  private cueGeneration = 0;
  private cue: { destination?: unknown } | null = null;
  private loaded = false;
  private grabOffset: Point | null = null;
  private lastPosition: Point | null = null;
  private pointerInterval: IntervalHandle | null = null;

  constructor(dependencies: TabDragPresentationWindowDependencies) {
    this.dependencies = dependencies;
    this.window = dependencies.createWindow({
      title: "",
      width: 1,
      height: 1,
      frame: false,
      transparent: true,
      backgroundColor: "#00000000",
      alwaysOnTop: true,
      enableLargerThanScreen: dependencies.isDarwin,
      focusable: false,
      show: false,
      skipTaskbar: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      hasShadow: true,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        javascript: false,
      },
    });
    this.window.setOpacity(0);
    if (dependencies.isDarwin) this.window.setVisibleOnAllWorkspaces(true);
    this.window.setIgnoreMouseEvents(true);
    this.window.on("closed", this.handleClosed);
    this.readyPromise = this.loadDocument();
  }

  async ready(): Promise<boolean> {
    return (await this.readyPromise) && !this.disposed;
  }

  updateCue(cue: { destination?: unknown } | null): Promise<boolean> {
    this.cue = cue;
    const generation = ++this.cueGeneration;
    this.cuePromise = this.cuePromise
      .then(async () => {
        if (this.disposed) return false;
        if (generation !== this.cueGeneration) return true;
        if (!(await this.ready())) return false;
        if (this.loaded) await this.applyCue();
        return !this.disposed;
      })
      .catch(() => {
        this[Symbol.dispose]();
        return false;
      });
    return this.cuePromise;
  }

  load(payload: TabDragPresentationLoad): Promise<boolean> {
    if (this.disposed || this.loadPromise != null) return Promise.resolve(false);
    this.loadPromise = this.withTimeout(() => this.loadSnapshot(payload));
    return this.loadPromise;
  }

  show(): Promise<boolean> {
    return this.withTimeout(async () => {
      if (this.loadPromise == null || !(await this.loadPromise)) return false;
      let generation: number;
      do {
        generation = this.cueGeneration;
        if (!(await this.cuePromise) || this.disposed) return false;
        const image = await this.window.webContents.capturePage();
        if (this.disposed || image.isEmpty()) return false;
      } while (generation !== this.cueGeneration);
      if (!this.updatePosition()) return false;
      this.window.setOpacity(1);
      return true;
    });
  }

  freeze(pointer: Point): boolean {
    if (this.disposed) return false;
    this.frozenPointer ??= { ...pointer };
    if (this.pointerInterval != null) {
      this.dependencies.clearInterval(this.pointerInterval);
      this.pointerInterval = null;
    }
    if (this.grabOffset != null) this.updatePosition();
    return true;
  }

  [Symbol.dispose](): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.pointerInterval != null) {
      this.dependencies.clearInterval(this.pointerInterval);
      this.pointerInterval = null;
    }
    this.window.off("closed", this.handleClosed);
    if (!this.window.isDestroyed()) this.window.destroy();
  }

  private async loadDocument(): Promise<boolean> {
    try {
      await this.window.loadURL(PRESENTATION_DOCUMENT);
      return !this.disposed;
    } catch {
      this[Symbol.dispose]();
      return false;
    }
  }

  private async loadSnapshot(payload: TabDragPresentationLoad): Promise<boolean> {
    if (!(await this.ready()) || this.disposed) return false;
    this.grabOffset = payload.grabOffset;
    this.window.setSize(payload.size.width, payload.size.height);
    const borderRadius = Math.min(
      payload.borderRadius,
      payload.size.width / 2,
      payload.size.height / 2,
    );
    await this.execute(`(async () => {
        const root = document.getElementById("snapshot");
        document.getElementById("card").style.borderRadius = ${JSON.stringify(`${borderRadius}px`)};
        root.style.transform = ${JSON.stringify(`scale(${payload.zoom})`)};
        root.innerHTML = ${JSON.stringify(payload.markup)};
        // The page screenshot is inline. A legacy remote favicon may never
        // resolve in this isolated window and must not block detachment.
        await Promise.allSettled(Array.from(root.querySelectorAll("img"))
          .filter(image => image.src.startsWith("data:"))
          .map(image => image.decode())
        );
      })()`);
    if (this.disposed) return false;
    this.loaded = true;
    if (!(await this.cuePromise) || this.disposed) return false;
    await this.applyCue();
    if (this.disposed || !this.updatePosition()) return false;
    this.startPointerTracking();
    return this.updatePosition();
  }

  private withTimeout(operation: () => Promise<boolean>): Promise<boolean> {
    let timeout: TimeoutHandle | undefined;
    return Promise.race([
      operation(),
      new Promise<boolean>((resolve) => {
        timeout = this.dependencies.setTimeout(
          () => resolve(false),
          this.dependencies.operationTimeoutMs,
        );
      }),
    ])
      .then((result) => {
        if (!result) this[Symbol.dispose]();
        return result;
      })
      .catch(() => {
        this[Symbol.dispose]();
        return false;
      })
      .finally(() => this.dependencies.clearTimeout(timeout));
  }

  private async applyCue(): Promise<void> {
    await this.execute(`(() => {
      const region = document.querySelector("[data-app-shell-tab-drag-cue-region]");
      if (region) {
        const destination = ${JSON.stringify(this.cue?.destination ?? null)};
        if (destination == null) {
          region.removeAttribute("data-drop-cue");
        } else {
          region.dataset.dropCue = destination;
        }
      }
    })()`);
  }

  private async execute(code: string): Promise<void> {
    await this.window.webContents.executeJavaScriptInIsolatedWorld(1001, [{ code }]);
  }

  private startPointerTracking(): void {
    if (!this.window.isVisible()) this.window.showInactive();
    if (this.frozenPointer == null && this.pointerInterval == null) {
      this.pointerInterval = this.dependencies.setInterval(() => {
        try {
          this.updatePosition();
        } catch {
          this[Symbol.dispose]();
        }
      }, 16);
    }
  }

  private updatePosition(): boolean {
    if (this.disposed || this.grabOffset == null) return false;
    const pointer = this.frozenPointer ?? this.dependencies.getCursorScreenPoint();
    const x = Math.round(pointer.x - this.grabOffset.x);
    const y = Math.round(pointer.y - this.grabOffset.y);
    if (this.lastPosition?.x !== x || this.lastPosition?.y !== y) {
      this.window.setPosition(x, y);
      this.lastPosition = { x, y };
    }
    return true;
  }

  private readonly handleClosed = () => this[Symbol.dispose]();
}

if (typeof module !== "undefined") module.exports = { TabDragPresentationWindow };
