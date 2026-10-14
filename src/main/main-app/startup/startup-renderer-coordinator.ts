type RendererPhase = "renderer_ready" | "first_content_visible" | "background_ready";

type Origin = {
  id: number;
  off(event: "destroyed", listener: () => void): void;
  once(event: "destroyed", listener: () => void): void;
};

type StartupPhases = {
  hasReached(phase: string): boolean;
  reach(phase: string): void;
  subscribe(listener: () => void): () => void;
};

type WindowManager = {
  getPrimaryWindow(): { webContents: { id: number } } | null | undefined;
  subscribePrimaryWindowChanges(
    listener: (window: { webContents: { id: number } } | null | undefined) => void,
  ): () => void;
};

export type StartupRendererCoordinatorDependencies = {
  includeStartupTiming?: boolean;
  isSentryEnabled(): boolean;
  origin: Origin;
  startupPhases: StartupPhases;
  startupReady: Promise<unknown> | null | undefined;
  windowManager: WindowManager;
};

/** Coordinates renderer startup phases with host readiness and primary-window ownership. */
export class StartupRendererCoordinator {
  private readonly dependencies: StartupRendererCoordinatorDependencies;
  private readonly bufferedPhases: RendererPhase[] = [];
  private unsubscribeFromStartupPhases: (() => void) | undefined;
  private unsubscribeFromPrimaryWindow: (() => void) | undefined;
  private isStartupReady: boolean;
  private isDisposed = false;

  constructor(dependencies: StartupRendererCoordinatorDependencies) {
    this.dependencies = dependencies;
    this.isStartupReady = dependencies.startupReady == null;
    dependencies.startupReady?.then(() => {
      if (this.isDisposed) return;
      this.isStartupReady = true;
      this.flushBufferedPhases();
    });
  }

  async whenReady(): Promise<unknown> {
    let timing: unknown;
    if (this.dependencies.startupReady != null) {
      let rejectReplacement!: (reason: unknown) => void;
      const rendererReplaced = new Promise<never>((_resolve, reject) => {
        rejectReplacement = reject;
      });
      const reject = () => {
        rejectReplacement(this.createReplacementError());
      };
      const unsubscribe = this.dependencies.windowManager.subscribePrimaryWindowChanges(
        (window) => {
          if (window?.webContents.id !== this.dependencies.origin.id) reject();
        },
      );
      this.dependencies.origin.once("destroyed", reject);
      try {
        timing = await Promise.race([this.dependencies.startupReady, rendererReplaced]);
      } finally {
        unsubscribe();
        this.dependencies.origin.off("destroyed", reject);
      }
    }
    if (
      this.isDisposed ||
      this.dependencies.windowManager.getPrimaryWindow()?.webContents.id !==
        this.dependencies.origin.id
    ) {
      throw this.createReplacementError();
    }
    return this.dependencies.includeStartupTiming ? timing : undefined;
  }

  isSentryEnabled(): boolean {
    return this.dependencies.isSentryEnabled();
  }

  reach(phase: string): void {
    if (
      (phase !== "renderer_ready" &&
        phase !== "first_content_visible" &&
        phase !== "background_ready") ||
      this.isDisposed ||
      this.dependencies.windowManager.getPrimaryWindow()?.webContents.id !==
        this.dependencies.origin.id
    ) {
      return;
    }

    if (!this.isStartupReady || !this.dependencies.startupPhases.hasReached("host_ready")) {
      this.bufferPhase(phase);
      return;
    }
    if (phase === "renderer_ready") {
      this.dependencies.startupPhases.reach("window_created");
    } else if (
      !this.dependencies.startupPhases.hasReached(
        phase === "first_content_visible" ? "renderer_ready" : "first_content_visible",
      )
    ) {
      return;
    }
    this.dependencies.startupPhases.reach(phase);
  }

  private bufferPhase(phase: RendererPhase): void {
    const previous = this.bufferedPhases.at(-1);
    if (
      phase === previous ||
      (phase === "renderer_ready" && previous != null) ||
      (phase === "first_content_visible" && previous !== "renderer_ready") ||
      (phase === "background_ready" && previous !== "first_content_visible")
    ) {
      return;
    }
    this.bufferedPhases.push(phase);
    if (this.unsubscribeFromStartupPhases != null) return;
    this.unsubscribeFromStartupPhases =
      this.dependencies.startupPhases.subscribe(this.flushBufferedPhases);
    this.unsubscribeFromPrimaryWindow =
      this.dependencies.windowManager.subscribePrimaryWindowChanges((window) => {
        if (window?.webContents.id !== this.dependencies.origin.id) this.disposeBufferedPhases();
      });
    this.dependencies.origin.once("destroyed", this.disposeBufferedPhases);
  }

  private readonly flushBufferedPhases = (): void => {
    if (
      !this.isStartupReady ||
      !this.dependencies.startupPhases.hasReached("host_ready") ||
      this.bufferedPhases.length === 0
    ) {
      return;
    }
    const phases = this.bufferedPhases.splice(0, this.bufferedPhases.length);
    this.clearBufferedPhases();
    for (const phase of phases) this.reach(phase);
  };

  private clearBufferedPhases(): void {
    this.bufferedPhases.length = 0;
    this.unsubscribeFromStartupPhases?.();
    this.unsubscribeFromStartupPhases = undefined;
    this.unsubscribeFromPrimaryWindow?.();
    this.unsubscribeFromPrimaryWindow = undefined;
    this.dependencies.origin.off("destroyed", this.disposeBufferedPhases);
  }

  private readonly disposeBufferedPhases = (): void => {
    this.isDisposed = true;
    this.clearBufferedPhases();
  };

  private createReplacementError(): DOMException {
    return new DOMException("Primary renderer was replaced", "AbortError");
  }
}

if (typeof module !== "undefined") module.exports = { StartupRendererCoordinator };
