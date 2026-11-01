export class MinimumIntervalGate {
  readonly minIntervalMs: number;
  private lastMarkedAtMs = -Infinity;

  constructor({ minIntervalMs }: { minIntervalMs: number }) {
    this.minIntervalMs = minIntervalMs;
  }

  canPass(now = Date.now()): boolean {
    return now - this.lastMarkedAtMs >= this.minIntervalMs;
  }

  mark(now = Date.now()): void {
    this.lastMarkedAtMs = now;
  }

  tryPass(now = Date.now()): boolean {
    if (!this.canPass(now)) return false;
    this.mark(now);
    return true;
  }
}
