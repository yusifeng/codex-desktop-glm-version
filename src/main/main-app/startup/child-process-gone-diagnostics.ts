export const RECOVERABLE_CHILD_PROCESS_LOG_TTL_MS = 60_000;

export interface ChildProcessGoneDetails {
  type: string;
  reason: string;
  exitCode: number;
  name?: string;
  serviceName?: string;
}

export function isRecoverableChildProcessGone(details: ChildProcessGoneDetails): boolean {
  return details.reason === `launch-failed` ||
    details.type === `GPU` ||
    (details.type === `Utility` && details.serviceName === `audio.mojom.AudioService`);
}

/** Classify, report, and rate-limit Electron child-process-gone events (original `Cue`). */
export class ChildProcessGoneDiagnostics {
  private readonly lastRecoverableLogByKey = new Map<string, number>();
  private recoverableLogCleanupTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly app: { on(event: string, listener: (event: unknown, details: ChildProcessGoneDetails) => void): void },
    private readonly errorReporter: {
      reportFatal(error: Error, context: unknown): void;
      reportNonFatal(error: Error, context: unknown): void;
    },
    private readonly logger: { warning(message: string, details: unknown): void },
    private readonly now: () => number = Date.now,
    private readonly setTimeoutImpl: typeof setTimeout = setTimeout,
  ) {}

  register(): void {
    this.app.on(`child-process-gone`, this.onChildProcessGone);
  }

  readonly onChildProcessGone = (_event: unknown, details: ChildProcessGoneDetails): void => {
    if (details.reason === `clean-exit`) return;
    if (isRecoverableChildProcessGone(details)) {
      this.logRecoverableChildProcessGone(details);
      return;
    }
    this.errorReporter.reportFatal(Error(`Child process gone (${details.type})`), {
      tags: { errorType: `child-process-gone`, processType: details.type, reason: details.reason },
      extra: {
        exitCode: details.exitCode,
        name: details.name,
        serviceName: details.serviceName,
      },
    });
  };

  private logRecoverableChildProcessGone(details: ChildProcessGoneDetails): void {
    let key = `${details.type}:${details.serviceName ?? details.name ?? ``}:${details.reason}:${details.exitCode}`;
    let timestamp = this.now();
    let lastLoggedAt = this.lastRecoverableLogByKey.get(key);
    if (lastLoggedAt != null && timestamp - lastLoggedAt < RECOVERABLE_CHILD_PROCESS_LOG_TTL_MS) return;
    this.lastRecoverableLogByKey.set(key, timestamp);
    this.scheduleRecoverableLogCleanup();
    if (details.type === `GPU`)
      this.errorReporter.reportNonFatal(Error(`GPU process gone`), {
        tags: { errorType: `gpu-process-gone`, processType: details.type, reason: details.reason },
        extra: {
          exitCode: details.exitCode,
          name: details.name,
          serviceName: details.serviceName,
        },
      });
    this.logger.warning(`Recoverable Chromium child process gone`, {
      safe: {
        exitCode: details.exitCode,
        name: details.name ?? null,
        processType: details.type,
        reason: details.reason,
        serviceName: details.serviceName ?? null,
      },
    });
  }

  private scheduleRecoverableLogCleanup(): void {
    if (this.recoverableLogCleanupTimer != null) return;
    this.recoverableLogCleanupTimer = this.setTimeoutImpl(() => {
      this.recoverableLogCleanupTimer = null;
      let timestamp = this.now();
      for (let [key, loggedAt] of this.lastRecoverableLogByKey)
        if (timestamp - loggedAt >= RECOVERABLE_CHILD_PROCESS_LOG_TTL_MS)
          this.lastRecoverableLogByKey.delete(key);
      if (this.lastRecoverableLogByKey.size > 0) this.scheduleRecoverableLogCleanup();
    }, RECOVERABLE_CHILD_PROCESS_LOG_TTL_MS);
    this.recoverableLogCleanupTimer.unref();
  }
}
