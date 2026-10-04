type GitWatchSetupDependencies = {
  hostKey: string;
  watchKey: string;
  hostIsLocal: boolean;
  commonDir: string;
  indexPath: (commonDir: string, hostIsLocal: boolean) => string;
  statIndex: (path: string) => Promise<{ size: number }>;
  bucketIndexSize: (size: number) => string;
  isCurrent: () => boolean;
  startWatcher: () => Promise<void>;
  clearOriginQueries: () => void;
  markReady: () => void;
  closeWatch: () => Promise<unknown>;
  getActiveSetup: () => Promise<unknown> | undefined;
  setActiveSetup: (setup: Promise<unknown>) => void;
  clearActiveSetup: (setup: Promise<unknown>) => void;
  setStartTrace: (trace: unknown) => void;
  getTrace: () => unknown;
};

/** Serialize repository watcher setup per host and converge stale watches. */
function scheduleGitWatchSetup(
  dependency: Promise<unknown> | undefined,
  deps: GitWatchSetupDependencies,
): Promise<unknown> {
  deps.setStartTrace(deps.getTrace());
  const setup = (deps.getActiveSetup() ?? Promise.resolve()).then(async () => {
    await dependency;
    try {
      if (deps.isCurrent()) {
        deps.statIndex(deps.indexPath(deps.commonDir, deps.hostIsLocal))
          .then(({ size }) => {
            if (deps.isCurrent()) deps.bucketIndexSize(size);
          })
          .catch(() => {});
        await deps.startWatcher();
      }
      if (deps.isCurrent()) {
        deps.clearOriginQueries();
        deps.markReady();
      } else {
        await deps.closeWatch();
      }
    } catch (error) {
      await deps.closeWatch();
      throw error;
    } finally {
      deps.setStartTrace(undefined);
    }
  });
  const observed = setup.catch(() => {});
  deps.setActiveSetup(observed);
  observed.then(() => deps.clearActiveSetup(observed));
  return setup;
}

export { scheduleGitWatchSetup };
if (typeof module !== `undefined`) module.exports = { scheduleGitWatchSetup };
