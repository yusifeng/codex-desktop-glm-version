/** 原 `RVe` / 压缩导出 `IH`。 */
export function errorValueToString(value: unknown): string | undefined {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  if (
    typeof value === "object" &&
    value != null &&
    "message" in value &&
    typeof value.message === "string" &&
    value.message.length > 0
  ) {
    return value.message;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** 原 `zVe` / 压缩导出 `FH`。 */
export function initializeErrorValueToString(): void {}

export interface MinimumIntervalGateOptions {
  minIntervalMs: number;
}

/** 原 `BVe` / 压缩导出 `NH`。 */
export class MinimumIntervalGate {
  readonly minIntervalMs: number;
  private lastMarkedAtMs = Number.NEGATIVE_INFINITY;

  constructor(options: MinimumIntervalGateOptions) {
    this.minIntervalMs = options.minIntervalMs;
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

/** 原 `QV` / 压缩导出 `PH`。 */
export function initializeMinimumIntervalGate(): void {}
