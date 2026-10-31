// @ts-nocheck

const TICK_INTERVAL_MS = 100;
const JANK_THRESHOLD_MS = 900;
const MAX_JANK_COUNT = 10;

/** Counts delayed main-thread timer ticks while excluding system suspension. */
export class MainThreadJankSampler {
  options: any;
  interval: any = null;
  expectedTickAtMs = 0;
  isSuspended = false;
  jankCountSinceLastSnapshot = 0;

  constructor(options: any) {
    this.options = options;
  }

  start() {
    if (this.interval != null) return;
    this.expectedTickAtMs = this.options.now() + TICK_INTERVAL_MS;
    this.options.powerMonitor.on(`suspend`, this.handleSuspend);
    this.options.powerMonitor.on(`resume`, this.handleResume);
    this.interval = this.options.setInterval(() => this.handleTick(), TICK_INTERVAL_MS);
    this.interval.unref();
  }

  stop() {
    if (this.interval == null) return;
    this.options.clearInterval(this.interval);
    this.interval = null;
    this.options.powerMonitor.off(`suspend`, this.handleSuspend);
    this.options.powerMonitor.off(`resume`, this.handleResume);
  }

  takeSnapshotFields() {
    const fields = {
      main_thread_jank_count_since_last_snapshot: this.jankCountSinceLastSnapshot,
    };
    this.jankCountSinceLastSnapshot = 0;
    return fields;
  }

  handleTick() {
    const currentTimeMs = this.options.now();
    if (this.isSuspended) {
      this.expectedTickAtMs = currentTimeMs + TICK_INTERVAL_MS;
      return;
    }
    if (currentTimeMs - this.expectedTickAtMs >= JANK_THRESHOLD_MS)
      this.jankCountSinceLastSnapshot = Math.min(
        this.jankCountSinceLastSnapshot + 1,
        MAX_JANK_COUNT,
      );
    this.expectedTickAtMs = currentTimeMs + TICK_INTERVAL_MS;
  }

  handleSuspend = () => {
    this.isSuspended = true;
  };

  handleResume = () => {
    this.isSuspended = false;
    this.expectedTickAtMs = this.options.now() + TICK_INTERVAL_MS;
  };
}

if (typeof module !== `undefined`) module.exports = { MainThreadJankSampler };
