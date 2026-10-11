type GitInitWatcherStartDependencies = {
  key: string;
  disposeActiveWatcher: () => void;
  createWatcher: () => any;
  setActiveWatcher: (value: { key: string; watcher: any }) => void;
  getActiveWatcher: () => { key: string; watcher: any } | null;
  clearActiveWatcher: () => void;
};

/** Owns Git-init watcher construction, activation, start status and cleanup. */
async function startGitInitWatcher(dependencies: GitInitWatcherStartDependencies): Promise<string> {
  const { key, disposeActiveWatcher, createWatcher, setActiveWatcher, getActiveWatcher, clearActiveWatcher } = dependencies;
  disposeActiveWatcher();
  const watcher = createWatcher();
  setActiveWatcher({ key, watcher });
  if (await watcher.start()) return `started`;
  const result = getActiveWatcher()?.watcher === watcher ? `failed` : `superseded`;
  if (result === `failed`) clearActiveWatcher();
  watcher.dispose();
  return result;
}

export { startGitInitWatcher };
if (typeof module !== `undefined`) module.exports = { startGitInitWatcher };
