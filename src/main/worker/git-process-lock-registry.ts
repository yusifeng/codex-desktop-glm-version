export interface GitProcessLockLease {
  close(): void;
  track(promise: PromiseLike<unknown>): void;
}

interface Deferred {
  promise: Promise<void>;
  resolve(): void;
}

export function createGitProcessLockRegistry(): {
  acquire(key: string, deadlineMs: number, signal?: AbortSignal): Promise<GitProcessLockLease | null>;
} {
  const locks = new Map<string, Deferred>();
  return {
    async acquire(key, deadlineMs, signal) {
      for (;;) {
        if (signal?.aborted || Date.now() >= deadlineMs) return null;
        const existing = locks.get(key);
        if (existing == null) {
          let resolve!: () => void;
          const promise = new Promise<void>((done) => { resolve = done; });
          const deferred = { promise, resolve };
          locks.set(key, deferred);
          let closed = false;
          let active = 0;
          const finish = () => {
            if (!closed || active > 0) return;
            if (locks.get(key) === deferred) locks.delete(key);
            deferred.resolve();
          };
          return {
            close() {
              closed = true;
              finish();
            },
            track(pending) {
              active += 1;
              const done = () => {
                active -= 1;
                finish();
              };
              pending.then(done, done);
            },
          };
        }
        let timer: ReturnType<typeof setTimeout> | undefined;
        let removeAbort = () => {};
        const available = await Promise.race([
          existing.promise.then(() => true),
          new Promise<boolean>((done) => {
            timer = setTimeout(() => done(false), Math.max(0, deadlineMs - Date.now()));
            if (signal != null) {
              const abort = () => done(false);
              signal.addEventListener("abort", abort, { once: true });
              removeAbort = () => signal.removeEventListener("abort", abort);
            }
          }),
        ]);
        if (timer != null) clearTimeout(timer);
        removeAbort();
        if (!available) return null;
      }
    },
  };
}
