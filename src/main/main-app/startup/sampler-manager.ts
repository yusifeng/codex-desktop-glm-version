type Logger = {
  debug(message: string, context: unknown): void;
  info(message: string, context: unknown): void;
};

type WebContentsLike = {
  id: number;
  isDestroyed(): boolean;
  once(event: "destroyed", listener: () => void): void;
  removeListener(event: "destroyed", listener: () => void): void;
};

type BrowserWindowLike = {
  isFocused(): boolean;
  isVisible(): boolean;
  webContents: WebContentsLike;
};

type RequestRegistry<T> = {
  delete(id: string): void;
  get(id: string, now: number): T | null | undefined;
  set(id: string, value: T, now: number): void;
};

type IntervalHandle = ReturnType<typeof setInterval> & { unref(): void };

export type SamplerManagerDependencies = {
  browserSessionRegistry: { getSnapshotFields(): Record<string, unknown> };
  clearInterval(handle: IntervalHandle): void;
  combineCpuSnapshots(initial: unknown, final: unknown): unknown;
  createId(): string;
  desktopSentry: { addBreadcrumb(value: unknown): void };
  electronSampler: {
    collectPerformanceSpanCpuSnapshot(webContents: WebContentsLike, phase?: "final"): unknown;
    collectSnapshotFields(webContents: WebContentsLike): Promise<Record<string, unknown>>;
  };
  getAllWindows(): BrowserWindowLike[];
  getStdioIoStatsSnapshot(): {
    bytesReadLast30s: number;
    bytesReadTotal: number;
    bytesWrittenLast30s: number;
    bytesWrittenTotal: number;
  } | null;
  heartbeatIntervalMs: number;
  hostId: string;
  jankSampler: {
    start(): void;
    stop(): void;
    takeSnapshotFields(): Record<string, unknown>;
  };
  logger(): Logger;
  now(): number;
  requestRegistry: RequestRegistry<{
    memoryDiagnosticsSnapshotFields?: Promise<Record<string, unknown>>;
    webContentsId: number;
  }>;
  setInterval(callback: () => void, delay: number): IntervalHandle;
  summarizeWindowAttention(windows: BrowserWindowLike[]): Record<string, unknown>;
  triggerGate: { canPass(now: number): boolean; mark(now: number): void };
  windowManager: {
    getPrimaryWindow(): BrowserWindowLike | null | undefined;
    isWebContentsReady(id: number): boolean;
    sendMessageToWebContents(webContents: WebContentsLike, message: unknown): void;
  };
};

type PerformanceSampling = {
  initialSnapshot: unknown;
  onDestroyed: () => void;
  webContents: WebContentsLike;
};

/** Owns app-state heartbeat, renderer snapshot requests, and performance-span sampling lifetime. */
export class SamplerManager {
  private readonly dependencies: SamplerManagerDependencies;
  private readonly appStateHeartbeat: IntervalHandle;
  private readonly performanceCpuSamplingById = new Map<string, PerformanceSampling>();

  constructor(dependencies: SamplerManagerDependencies) {
    this.dependencies = dependencies;
    this.appStateHeartbeat = dependencies.setInterval(() => {
      this.requestAppStateSnapshot("heartbeat");
    }, dependencies.heartbeatIntervalMs);
    this.appStateHeartbeat.unref();
    dependencies.jankSampler.start();
  }

  dispose(): void {
    this.dependencies.clearInterval(this.appStateHeartbeat);
    this.dependencies.jankSampler.stop();
    for (const id of this.performanceCpuSamplingById.keys()) {
      this.cancelPerformanceSpanCpuSampling(id);
    }
  }

  startPerformanceSpanCpuSampling(webContents: WebContentsLike, id: string): void {
    this.cancelPerformanceSpanCpuSampling(id);
    const onDestroyed = () => {
      this.cancelPerformanceSpanCpuSampling(id);
    };
    webContents.once("destroyed", onDestroyed);
    this.performanceCpuSamplingById.set(id, {
      initialSnapshot:
        this.dependencies.electronSampler.collectPerformanceSpanCpuSnapshot(webContents),
      onDestroyed,
      webContents,
    });
  }

  cancelPerformanceSpanCpuSampling(id: string): void {
    const sampling = this.performanceCpuSamplingById.get(id);
    if (sampling == null) return;
    this.performanceCpuSamplingById.delete(id);
    sampling.webContents.removeListener("destroyed", sampling.onDestroyed);
  }

  finishPerformanceSpanCpuSampling(id: string): unknown {
    const sampling = this.performanceCpuSamplingById.get(id);
    if (sampling == null) return null;
    this.cancelPerformanceSpanCpuSampling(id);
    if (sampling.webContents.isDestroyed()) return null;
    return this.dependencies.combineCpuSnapshots(
      sampling.initialSnapshot,
      this.dependencies.electronSampler.collectPerformanceSpanCpuSnapshot(
        sampling.webContents,
        "final",
      ),
    );
  }

  handleRendererReady(webContents: WebContentsLike): void {
    this.requestAppStateSnapshot("heartbeat", webContents);
  }

  async handleMessage(webContents: WebContentsLike, message: any): Promise<void> {
    switch (message.type) {
      case "electron-app-state-snapshot-trigger":
        this.requestAppStateSnapshot(message.reason, webContents);
        break;
      case "electron-app-state-snapshot-response":
        await this.handleAppStateSnapshotResponse(webContents, message);
    }
  }

  private async enrichWithHostSnapshotFields(
    webContents: WebContentsLike,
    fields: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const hostFields = await this.dependencies.electronSampler.collectSnapshotFields(webContents);
    return {
      ...this.addHostSnapshotFields(fields, hostFields),
      ...this.dependencies.jankSampler.takeSnapshotFields(),
    };
  }

  private addHostSnapshotFields(
    fields: Record<string, unknown>,
    hostFields: Record<string, unknown>,
  ): Record<string, unknown> {
    const io = this.dependencies.getStdioIoStatsSnapshot();
    const result = {
      ...fields,
      ...hostFields,
      ...this.dependencies.browserSessionRegistry.getSnapshotFields(),
    };
    if (io != null) {
      Object.assign(result, {
        app_server_stdio_bytes_read_total: io.bytesReadTotal,
        app_server_stdio_bytes_written_total: io.bytesWrittenTotal,
        app_server_stdio_bytes_read_last_30s: io.bytesReadLast30s,
        app_server_stdio_bytes_written_last_30s: io.bytesWrittenLast30s,
      });
    }
    return result;
  }

  private async handleAppStateSnapshotResponse(
    webContents: WebContentsLike,
    message: { fields: Record<string, unknown>; requestId: string },
  ): Promise<void> {
    const now = this.dependencies.now();
    const request = this.dependencies.requestRegistry.get(message.requestId, now);
    if (request == null || request.webContentsId !== webContents.id) return;
    this.dependencies.requestRegistry.delete(message.requestId);

    const fields = await this.enrichWithHostSnapshotFields(webContents, message.fields);
    if (request.memoryDiagnosticsSnapshotFields != null) {
      Object.assign(fields, await request.memoryDiagnosticsSnapshotFields);
    }
    const jankCount = Number(fields.main_thread_jank_count_since_last_snapshot ?? 0);
    if (jankCount > 0) {
      this.dependencies.logger().info("main_thread_jank_snapshot", {
        safe: {
          mainThreadJankCountSinceLastSnapshot: jankCount,
          snapshotReason: fields.snapshot_reason,
          ...this.dependencies.summarizeWindowAttention(this.dependencies.getAllWindows()),
        },
        sensitive: {},
      });
    }
    this.dependencies.logger().debug("app_state_snapshot", { safe: fields, sensitive: {} });
    this.dependencies.desktopSentry.addBreadcrumb({
      category: "app_state",
      level: "info",
      message: "app_state_snapshot",
      data: fields,
    });
  }

  private requestAppStateSnapshot(reason: string, webContents?: WebContentsLike): void {
    const now = this.dependencies.now();
    if (reason !== "heartbeat" && !this.dependencies.triggerGate.canPass(now)) return;

    const primaryWindow = webContents == null ? this.dependencies.windowManager.getPrimaryWindow() : null;
    const target = webContents ?? primaryWindow?.webContents;
    if (
      target == null ||
      target.isDestroyed() ||
      !this.dependencies.windowManager.isWebContentsReady(target.id) ||
      (reason === "heartbeat" && webContents == null && primaryWindow != null && !primaryWindow.isFocused())
    ) {
      return;
    }

    this.dependencies.triggerGate.mark(now);
    const requestId = this.dependencies.createId();
    this.dependencies.requestRegistry.set(
      requestId,
      { memoryDiagnosticsSnapshotFields: undefined, webContentsId: target.id },
      now,
    );
    this.dependencies.windowManager.sendMessageToWebContents(target, {
      type: "electron-app-state-snapshot-request",
      hostId: this.dependencies.hostId,
      requestId,
      reason,
    });
  }
}

if (typeof module !== "undefined") module.exports = { SamplerManager };
