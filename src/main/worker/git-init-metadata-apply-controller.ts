type GitInitMetadataApplyDependencies = {
  cwd: string;
  host: any;
  key: string;
  getDesiredWatchKey: () => string | null;
  setDesiredWatchKey: (key: string | null) => void;
  getStableMetadata: (cwd: string, host: any) => Promise<any>;
  disposeActiveWatcher: () => void;
  ensureWatching: (metadata: { commonDir: string; root: string }, host: any) => Promise<void>;
  disposeGitInitWatcher: (cwd: string, host: any) => void;
  unwatchRepo: (root: string, host: any, options: { emitEvent: boolean }) => void;
  emitHeadChange: (metadata: { commonDir: string; root: string }, cwd: string, host: any) => void;
};

/** Applies Git-init metadata and reconciles repository/watch ownership. */
async function applyGitInitMetadata(dependencies: GitInitMetadataApplyDependencies): Promise<boolean> {
  const { cwd, host, key, getDesiredWatchKey, setDesiredWatchKey, getStableMetadata, disposeActiveWatcher, ensureWatching,
    disposeGitInitWatcher, unwatchRepo, emitHeadChange } = dependencies;
  const metadata = await getStableMetadata(cwd, host);
  if (!metadata || getDesiredWatchKey() !== key) return false;
  disposeActiveWatcher();
  try {
    await ensureWatching(metadata, host);
  } catch (error) {
    if (getDesiredWatchKey() === key) setDesiredWatchKey(null);
    throw error;
  }
  if (getDesiredWatchKey() !== key) {
    unwatchRepo(metadata.root, host, { emitEvent: false });
    return false;
  }
  disposeGitInitWatcher(cwd, host);
  emitHeadChange(metadata, cwd, host);
  return true;
}

export { applyGitInitMetadata };
if (typeof module !== `undefined`) module.exports = { applyGitInitMetadata };
