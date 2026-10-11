export interface RollingWindowCounter {
  record(value: number, atMs?: number): void;
  getSnapshot(atMs?: number): { count: number };
}

export interface RollingWindowCounterFactory {
  (options: { windowMs: number }): RollingWindowCounter;
}

export interface WorkerInvocationSnapshot {
  totalInvocations: number;
  invocationsLast30s: number;
}

/** Tracks worker request volume while leaving the rolling-window implementation injectable. */
export class WorkerInvocationSampler {
  private totalInvocations = 0;
  private readonly rollingWindowCounter: RollingWindowCounter;

  constructor(
    createRollingWindowCounter: RollingWindowCounterFactory,
    private readonly windowMs = 30_000,
  ) {
    this.rollingWindowCounter = createRollingWindowCounter({ windowMs });
  }

  recordInvocation(atMs = Date.now()): void {
    this.totalInvocations += 1;
    this.rollingWindowCounter.record(1, atMs);
  }

  getSnapshot(atMs = Date.now()): WorkerInvocationSnapshot {
    const snapshot = this.rollingWindowCounter.getSnapshot(atMs);
    return {
      totalInvocations: this.totalInvocations,
      invocationsLast30s: snapshot.count,
    };
  }
}

if (typeof module !== `undefined`) module.exports = { WorkerInvocationSampler };
