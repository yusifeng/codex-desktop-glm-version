export interface RollingWindowCounterLike {
  record(value: number, atMs?: number): void;
  getSnapshot(atMs?: number): { count: number; sum?: number };
}

export interface RollingWindowCounterFactory {
  (options: { windowMs: number }): RollingWindowCounterLike;
}

/** Fixed-duration rolling count/sum with amortized compaction. */
export class RollingWindowCounter implements RollingWindowCounterLike {
  private readonly entries: Array<{ atMs: number; value: number }> = [];
  private headIndex = 0;
  private rollingSum = 0;

  constructor(private readonly windowMs: number) {}

  record(value: number, atMs = Date.now()): void {
    this.entries.push({ atMs, value });
    this.rollingSum += value;
    this.prune(atMs);
  }

  getSnapshot(atMs = Date.now()): { count: number; sum: number } {
    this.prune(atMs);
    return { count: this.entries.length - this.headIndex, sum: this.rollingSum };
  }

  private prune(atMs: number): void {
    const cutoff = atMs - this.windowMs;
    while (this.headIndex < this.entries.length && this.entries[this.headIndex].atMs < cutoff) {
      this.rollingSum -= this.entries[this.headIndex].value;
      this.headIndex += 1;
    }
    if (this.headIndex !== 0 && this.headIndex * 2 >= this.entries.length) {
      this.entries.splice(0, this.headIndex);
      this.headIndex = 0;
    }
  }
}

export interface WorkerInvocationSnapshot {
  totalInvocations: number;
  invocationsLast30s: number;
}

/** Tracks worker request volume while leaving the rolling-window implementation injectable. */
export class WorkerInvocationSampler {
  private totalInvocations = 0;
  private readonly rollingWindowCounter: RollingWindowCounterLike;

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

export function createGitWorkerInvocationSampler(
  createRollingWindowCounter: RollingWindowCounterFactory,
): WorkerInvocationSampler {
  return new WorkerInvocationSampler(createRollingWindowCounter, 30_000);
}

if (typeof module !== `undefined`)
  module.exports = { RollingWindowCounter, WorkerInvocationSampler, createGitWorkerInvocationSampler };
