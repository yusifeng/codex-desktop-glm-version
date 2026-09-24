// 启动阶段状态机：bootstrap → host_ready → window_created → renderer_ready →
// first_content_visible → background_ready 的单调推进，支持 subscribe /
// getSnapshot（useSyncExternalStore 形态）、whenReached 与 dispose（abort）。
// 对应 bootstrap-C4dRql4x.ts 189-254 行（we/Te/Ee）。

/** 启动阶段（按时间顺序，原 we）。 */
export const STARTUP_PHASES = [
  "bootstrap",
  "host_ready",
  "window_created",
  "renderer_ready",
  "first_content_visible",
  "background_ready",
] as const;

export type StartupPhase = (typeof STARTUP_PHASES)[number];

/** AbortSignal → Error 的转换（原 Ee）：reason 为 Error 时原样返回。 */
export function abortErrorConverter(signal: AbortSignal): Error {
  return signal.reason instanceof Error
    ? signal.reason
    : new DOMException("Startup was canceled", "AbortError");
}

export class StartupPhases {
  abortController = new AbortController();
  listeners = new Set<() => void>();
  phase: StartupPhase;

  constructor(phase: StartupPhase = "bootstrap") {
    this.phase = phase;
  }

  getSnapshot = (): StartupPhase => this.phase;

  subscribe = (listener: () => void): (() => void) =>
    this.abortController.signal.aborted
      ? () => {}
      : (this.listeners.add(listener),
        () => {
          this.listeners.delete(listener);
        });

  hasReached(phase: StartupPhase): boolean {
    return STARTUP_PHASES.indexOf(this.phase) >= STARTUP_PHASES.indexOf(phase);
  }

  reach(phase: StartupPhase): void {
    if (!(this.abortController.signal.aborted || this.hasReached(phase))) {
      this.phase = phase;
      for (const listener of this.listeners) listener();
    }
  }

  whenReached(phase: StartupPhase, signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) return Promise.reject(abortErrorConverter(signal));
    if (this.abortController.signal.aborted)
      return Promise.reject(abortErrorConverter(this.abortController.signal));
    if (this.hasReached(phase)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const unsubscribe = this.subscribe(() => {
        if (this.hasReached(phase)) {
          cleanup();
          resolve();
        }
      });
      const onAborted = () => {
        cleanup();
        reject(abortErrorConverter(signal?.aborted ? signal : this.abortController.signal));
      };
      const cleanup = () => {
        unsubscribe();
        signal?.removeEventListener("abort", onAborted);
        this.abortController.signal.removeEventListener("abort", onAborted);
      };
      signal?.addEventListener("abort", onAborted, { once: true });
      this.abortController.signal.addEventListener("abort", onAborted, { once: true });
    });
  }

  dispose(): void {
    if (this.abortController.signal.aborted) return;
    this.abortController.abort(new DOMException("Startup was disposed", "AbortError"));
    this.listeners.clear();
  }
}
