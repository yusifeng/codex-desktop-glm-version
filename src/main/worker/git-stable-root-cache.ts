type TimerHandle = ReturnType<typeof setTimeout> | number;

type StableRootCacheEntry = {
  expiresAtMs: number;
  expiryTimer: TimerHandle;
  root: string | null;
  token: object;
};

type GitStableRootCacheOptions = {
  clearTimeout: (timer: TimerHandle) => void;
  getGeneration: () => number;
  maxAgeMs: number;
  maxEntries: number;
  now: () => number;
  setTimeout: (callback: () => void, delayMs: number) => TimerHandle;
};

class GitStableRootCache {
  private readonly entries = new Map<string, StableRootCacheEntry>();
  private readonly options: GitStableRootCacheOptions;

  constructor(options: GitStableRootCacheOptions) {
    this.options = options;
  }

  get size() {
    return this.entries.size;
  }

  set(key: string, root: string | null, generation: number) {
    if (generation !== this.options.getGeneration()) return;
    this.delete(key);
    const token = {};
    const expiryTimer = this.options.setTimeout(() => {
      if (this.entries.get(key)?.token === token) this.delete(key);
    }, this.options.maxAgeMs);
    (expiryTimer as any).unref?.();
    this.entries.set(key, {
      expiresAtMs: this.options.now() + this.options.maxAgeMs,
      expiryTimer,
      root,
      token,
    });
    while (this.entries.size > this.options.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey == null) break;
      this.delete(oldestKey);
    }
  }

  get(key: string): string | null | undefined {
    const entry = this.entries.get(key);
    if (entry == null) return undefined;
    if (this.options.now() >= entry.expiresAtMs) {
      this.delete(key);
      return undefined;
    }
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.root;
  }

  delete(key: string) {
    const entry = this.entries.get(key);
    if (entry == null) return;
    this.options.clearTimeout(entry.expiryTimer);
    this.entries.delete(key);
  }

  clear() {
    for (const key of [...this.entries.keys()]) this.delete(key);
  }
}

export { GitStableRootCache };
if (typeof module !== `undefined`) module.exports = { GitStableRootCache };
