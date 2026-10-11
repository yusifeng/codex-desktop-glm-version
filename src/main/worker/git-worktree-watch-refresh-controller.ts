/** Reconciles discovered Git worktree directories with active watcher targets. */
function createGitWorktreeWatchRefreshController(input: {
  isDisposed: () => boolean;
  getRootTarget: (path: string) => any;
  getGeneration: (target: any) => number;
  isMissing: (target: any) => boolean;
  readDirectory: (path: string) => Promise<Array<{ isDirectory(): boolean; name: string }>>;
  join: (root: string, name: string) => string;
  isMissingPathError: (error: unknown) => boolean;
  onDiscoveryFailure: (error: unknown, path: string) => void;
  scheduleRetry: (target: any) => void;
  disposeSession: (target: any) => Promise<unknown>;
  markMissing: (target: any) => void;
  getTargets: () => any[];
  partition: (existing: string[], discovered: string[]) => { stalePaths: string[]; newPaths: string[] };
  getGitDir: () => string | null;
  removeTarget: (target: any) => void;
  findTarget: (path: string) => any;
  addTarget: (path: string, parentPath: string) => any;
  hasTopologyHandler: (target: any) => boolean;
  startSession: (target: any, recovering: boolean) => Promise<unknown>;
  updateRecovery: () => void;
}) {
  async function refresh(worktreesPath: string, recovering: boolean): Promise<void> {
    const rootTarget = input.getRootTarget(worktreesPath);
    if (input.isDisposed() || rootTarget == null) return;
    const generation = input.getGeneration(rootTarget);
    let discovered: string[] = [];
    if (!input.isMissing(rootTarget)) {
      try {
        discovered = (await input.readDirectory(worktreesPath))
          .filter((entry) => entry.isDirectory())
          .map((entry) => input.join(worktreesPath, entry.name));
      } catch (error) {
        if (input.isDisposed() || generation !== input.getGeneration(rootTarget)) return;
        if (!input.isMissingPathError(error)) {
          input.onDiscoveryFailure(error, worktreesPath);
          await input.disposeSession(rootTarget);
          input.updateRecovery();
          input.scheduleRetry(rootTarget);
          return;
        }
        input.markMissing(rootTarget);
        await input.disposeSession(rootTarget);
      }
    }
    if (input.isDisposed() || (generation !== input.getGeneration(rootTarget) && !input.isMissing(rootTarget))) return;
    let staleTargets = input.getTargets().filter((target) => target.metadataDirectory?.parentPath === worktreesPath);
    const { stalePaths } = input.partition(staleTargets.map((target) => target.watchPath), discovered);
    staleTargets = staleTargets.filter((target) => stalePaths.includes(target.watchPath));
    await Promise.all(staleTargets.map(async (target) => {
      const disposed = input.disposeSession(target);
      if (target.watchPath === input.getGitDir()) input.markMissing(target);
      else input.removeTarget(target);
      await disposed;
    }));
    if (input.isDisposed()) return;
    await Promise.all(discovered.map(async (path) => {
      let target = input.findTarget(path);
      if (!input.hasTopologyHandler(target)) target = input.addTarget(path, worktreesPath);
      if (target.session == null) await input.startSession(target, recovering);
    }));
    input.updateRecovery();
  }
  return { refresh };
}

export { createGitWorktreeWatchRefreshController };
if (typeof module !== "undefined") module.exports = { createGitWorktreeWatchRefreshController };
