type AnyRecord = Record<string, any>;

const PHASE_TIMEOUT_MS = 60_000;
const NAVIGATION_STAGE_EVENT = "main-frame-navigation-stage-changed";

export function createIncompleteNavigationRuntime(dependencies: {
  DisposableBase: new (...args: any[]) => AnyRecord;
  createAsyncScope(): { d(): void; e?: unknown; u<T>(value: T): T };
  createLogger(name: string): () => { info(message: string): void };
}) {
  const deliveries: Array<(input: AnyRecord) => Promise<void>> = [];
  const logger = dependencies.createLogger("in-app-browser-incomplete-navigation-service");

  class IncompleteNavigationSubscription extends dependencies.DisposableBase {
    delivery: ((input: AnyRecord) => Promise<void>) | null = null;
    listener: any = null;

    constructor(owner: AnyRecord) {
      super();
      owner.once("destroyed", () => this[Symbol.dispose]());
    }

    subscribe(listener: any): void {
      this.unsubscribe();
      this.listener = listener.dup();
      this.listener.onRpcBroken(() => this.unsubscribe());
      const activeListener = this.listener;
      this.delivery = async (input: AnyRecord) => {
        const scope = dependencies.createAsyncScope();
        try {
          await scope.u(activeListener(input));
        } catch (error) {
          scope.e = error;
        } finally {
          scope.d();
        }
      };
      deliveries.push(this.delivery);
    }

    unsubscribe(): void {
      if (this.delivery != null) {
        const index = deliveries.indexOf(this.delivery);
        if (index !== -1) deliveries.splice(index, 1);
      }
      this.delivery = null;
      this.listener?.[Symbol.dispose]();
      this.listener = null;
    }

    [Symbol.dispose](): void {
      this.unsubscribe();
    }
  }

  function reportIncompleteNavigation(input: AnyRecord): void {
    deliveries.at(-1)?.(input).catch(() => {
      logger().info("Failed to deliver incomplete in-app browser navigation");
    });
  }

  function createNavigationObserver(onTimeout: (observation: AnyRecord) => void) {
    let current: AnyRecord | null = null;
    let timedOutNavigationId: unknown = null;
    const clearCurrent = () => {
      if (current?.phaseTimeout != null) clearTimeout(current.phaseTimeout);
      current = null;
    };
    const observation = (state: AnyRecord, now: number) => ({
      lastObservedPhase: state.phase,
      totalNavigationDurationMs: now - state.navigationStartedAtMs,
      lastObservedPhaseDurationMs: now - state.phaseStartedAtMs,
    });
    const schedule = () => {
      const scheduled = current;
      if (scheduled == null) return;
      scheduled.phaseTimeout = setTimeout(() => {
        if (current !== scheduled) return;
        const result = observation(scheduled, Date.now());
        timedOutNavigationId = scheduled.navigationId;
        clearCurrent();
        onTimeout(result);
      }, PHASE_TIMEOUT_MS);
    };
    const finish = () => {
      clearCurrent();
      timedOutNavigationId = null;
    };
    return {
      dispose: finish,
      finishCurrentNavigation: finish,
      handleStageChanged(event: AnyRecord): void {
        if (event.phase === "finished") {
          if (current?.navigationId === event.navigationId) clearCurrent();
          if (timedOutNavigationId === event.navigationId) timedOutNavigationId = null;
          return;
        }
        if (timedOutNavigationId === event.navigationId) return;
        const now = Date.now();
        if (current?.navigationId !== event.navigationId) {
          clearCurrent();
          timedOutNavigationId = null;
          current = { navigationId: event.navigationId, navigationStartedAtMs: now, phase: event.phase, phaseStartedAtMs: now, phaseTimeout: null };
          schedule();
          return;
        }
        if (current.phase !== event.phase) {
          if (current.phaseTimeout != null) clearTimeout(current.phaseTimeout);
          current.phase = event.phase;
          current.phaseStartedAtMs = now;
          current.phaseTimeout = null;
          schedule();
        }
      },
      takeObservation(minimumPhaseDurationMs: number): AnyRecord | null {
        if (current == null) return null;
        const result = observation(current, Date.now());
        finish();
        return result.lastObservedPhaseDurationMs > minimumPhaseDurationMs ? result : null;
      },
    };
  }

  function attachNavigationObserver(webContents: AnyRecord, onTimeout: (observation: AnyRecord) => void) {
    const observer = createNavigationObserver(onTimeout);
    const handleStageChanged = (_event: unknown, stage: AnyRecord) => observer.handleStageChanged(stage);
    webContents.on(NAVIGATION_STAGE_EVENT, handleStageChanged);
    return {
      ...observer,
      dispose(): void {
        webContents.removeListener(NAVIGATION_STAGE_EVENT, handleStageChanged);
        observer.dispose();
      },
    };
  }

  return { IncompleteNavigationSubscription, reportIncompleteNavigation, createNavigationObserver, attachNavigationObserver };
}
