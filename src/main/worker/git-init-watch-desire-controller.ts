type GitInitWatchDesireDependencies = {
  key: string;
  getDesiredWatchKey: () => string | null;
  setDesiredWatchKey: (key: string | null) => void;
  disposeWatcher: () => void;
  startWatcher: () => Promise<string>;
};

/** Coordinates desired Git-init watcher ownership and failed-start cleanup. */
async function ensureGitInitWatchDesired(dependencies: GitInitWatchDesireDependencies): Promise<void> {
  const { key, getDesiredWatchKey, setDesiredWatchKey, disposeWatcher, startWatcher } = dependencies;
  if (getDesiredWatchKey() === key) return;
  disposeWatcher();
  setDesiredWatchKey(key);
  const result = await startWatcher();
  if (result === `failed` && getDesiredWatchKey() === key) setDesiredWatchKey(null);
}

export { ensureGitInitWatchDesired };
if (typeof module !== `undefined`) module.exports = { ensureGitInitWatchDesired };
