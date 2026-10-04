type WorktreeLifecycleState = {
  deletePromises: Map<string, Promise<any>>;
  restorePromises: Map<string, Promise<any>>;
  hostKey: (host: any) => string;
};

function createWorktreeLifecycle(state: WorktreeLifecycleState) {
  async function scheduleDelete(params: any, host: any, run: () => Promise<any>) {
    const key = `${state.hostKey(host)}|${params.worktree}`;
    const existing = state.deletePromises.get(key);
    if (existing != null) return existing;
    const operation = run();
    state.deletePromises.set(key, operation);
    try {
      return await operation;
    } finally {
      state.deletePromises.delete(key);
    }
  }

  async function scheduleRestore(
    repoRoot: string,
    worktreePath: string,
    cwd: string,
    host: any,
    signal: AbortSignal,
    run: () => Promise<boolean>,
  ) {
    const key = `${state.hostKey(host)}|${worktreePath}`;
    const previous = state.restorePromises.get(key) ?? Promise.resolve(true);
    const operation = previous.catch(() => true).then(run);
    state.restorePromises.set(key, operation);
    try {
      return await operation;
    } finally {
      if (state.restorePromises.get(key) === operation) state.restorePromises.delete(key);
    }
  }

  return { scheduleDelete, scheduleRestore };
}

export { createWorktreeLifecycle };
if (typeof module !== `undefined`) module.exports = { createWorktreeLifecycle };
