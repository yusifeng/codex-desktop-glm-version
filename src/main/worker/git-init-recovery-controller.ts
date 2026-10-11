type GitInitRecoveryDependencies = {
  cwd: string;
  host: any;
  watcher: any;
  getWatchKey: (cwd: string, host: any) => string;
  getDesiredWatchKey: () => string | null;
  setDesiredWatchKey: (key: string | null) => void;
  getActiveWatch: () => { watcher: any } | null;
  clearActiveWatch: () => void;
  handledWatchers: WeakSet<object>;
  refreshMetadata: (cwd: string, host: any) => Promise<boolean>;
  startWatcher: (cwd: string, host: any, mode: string) => Promise<string>;
};

/** Coordinates Git-init watcher recovery after metadata becomes available. */
async function handleGitInitRecovery(dependencies: GitInitRecoveryDependencies): Promise<void> {
  const { cwd, host, watcher, getWatchKey, getDesiredWatchKey, setDesiredWatchKey, getActiveWatch,
    clearActiveWatch, handledWatchers, refreshMetadata, startWatcher } = dependencies;
  const key = getWatchKey(cwd, host);
  if (handledWatchers.has(watcher) || getDesiredWatchKey() !== key || getActiveWatch()?.watcher !== watcher) return;
  handledWatchers.add(watcher);
  clearActiveWatch();
  try {
    if (await refreshMetadata(cwd, host) || getDesiredWatchKey() !== key) return;
    const result = await startWatcher(cwd, host, `watch-git-metadata`);
    if (getDesiredWatchKey() !== key) return;
    let refreshed = false;
    try {
      refreshed = await refreshMetadata(cwd, host);
    } finally {
      if (!refreshed && result === `failed` && getDesiredWatchKey() === key) setDesiredWatchKey(null);
    }
  } catch (error) {
    if (getDesiredWatchKey() === key && getActiveWatch() == null) setDesiredWatchKey(null);
    throw error;
  }
}

export { handleGitInitRecovery };
if (typeof module !== `undefined`) module.exports = { handleGitInitRecovery };
