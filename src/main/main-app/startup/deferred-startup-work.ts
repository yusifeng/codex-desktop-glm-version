export const DEFAULT_DEFERRED_STARTUP_FALLBACK_MS = 10_000;

type StartupPhases = {
  whenReached(phase: string, signal: AbortSignal): Promise<unknown>;
};

export function scheduleDeferredStartupWork({
  startupPhases,
  phase,
  fallback,
  start,
  onError,
}: {
  startupPhases: StartupPhases;
  phase: string;
  fallback?: { phase: string; timeoutMs: number } | null;
  start: () => void;
  onError: (error: unknown) => void;
}) {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let started = false;

  const run = () => {
    if (controller.signal.aborted || started) return;
    started = true;
    if (timeout != null) {
      globalThis.clearTimeout(timeout);
      timeout = undefined;
    }
    start();
  };
  const reportError = (error: unknown) => {
    if (!(error instanceof Error && error.name === `AbortError`)) onError(error);
  };

  startupPhases.whenReached(phase, controller.signal).then(run).catch(reportError);
  if (fallback != null) {
    startupPhases.whenReached(fallback.phase, controller.signal).then(() => {
      if (controller.signal.aborted || started) return;
      timeout = globalThis.setTimeout(() => {
        timeout = undefined;
        try {
          run();
        } catch (error) {
          reportError(error);
        }
      }, fallback.timeoutMs);
      timeout.unref?.();
    }).catch(reportError);
  }

  return {
    dispose() {
      if (timeout != null) {
        globalThis.clearTimeout(timeout);
        timeout = undefined;
      }
      if (!controller.signal.aborted) {
        controller.abort(new DOMException(`Deferred startup work was canceled`, `AbortError`));
      }
    },
  };
}
