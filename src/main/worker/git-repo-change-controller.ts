type RepoChangeController = {
  record(changeType: string): void;
  schedule(changeType: string): void;
  consume(changeType: string): number;
  complete(changeType: string): void;
  dispose(): void;
};

function createGitRepoChangeController(input: {
  delayMs: number;
  isDisposed: () => boolean;
  emit: (changeType: string) => Promise<void>;
  onError: (changeType: string, error: unknown) => void;
  setTimeout?: typeof setTimeout;
  clearTimeout?: typeof clearTimeout;
}): RepoChangeController {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const active = new Set<string>();
  const counts = new Map<string, number>();
  const schedule = (changeType: string) => {
    if (input.isDisposed() || active.has(changeType) || timers.has(changeType)) return;
    const timer = (input.setTimeout ?? setTimeout)(() => {
      timers.delete(changeType);
      input.emit(changeType).catch((error) => input.onError(changeType, error));
    }, input.delayMs);
    timers.set(changeType, timer);
  };
  return {
    record(changeType) { counts.set(changeType, (counts.get(changeType) ?? 0) + 1); },
    schedule,
    consume(changeType) {
      active.add(changeType);
      const count = counts.get(changeType) ?? 0;
      counts.set(changeType, 0);
      return count;
    },
    complete(changeType) {
      active.delete(changeType);
      if ((counts.get(changeType) ?? 0) > 0) schedule(changeType);
    },
    dispose() {
      const clear = input.clearTimeout ?? clearTimeout;
      for (const timer of timers.values()) clear(timer);
      timers.clear();
      active.clear();
    },
  };
}

export { createGitRepoChangeController };
if (typeof module !== `undefined`) module.exports = { createGitRepoChangeController };
