type StableMetadataDependencies = {
  gitManager: { getStableMetadata: (cwd: unknown, host: any) => Promise<any> };
  host: any;
  ensureWatchingForGitInit: (cwd: unknown, host: any) => Promise<unknown>;
  disposeGitInitWatcher: (cwd: unknown, host: any) => void;
  encodeResult: (value: unknown) => unknown;
};

/** Resolve repository metadata while preserving the Git-init watcher protocol. */
async function resolveStableMetadata(params: { cwd: unknown; watchForGitInit?: boolean }, deps: StableMetadataDependencies) {
  const metadata = await deps.gitManager.getStableMetadata(params.cwd, deps.host);
  if (metadata == null) {
    if (params.watchForGitInit === true) await deps.ensureWatchingForGitInit(params.cwd, deps.host);
    else if (params.watchForGitInit === false) deps.disposeGitInitWatcher(params.cwd, deps.host);
    return deps.encodeResult(null);
  }
  if (params.watchForGitInit != null) deps.disposeGitInitWatcher(params.cwd, deps.host);
  return deps.encodeResult({ commonDir: metadata.commonDir, root: metadata.root });
}

export { resolveStableMetadata };
if (typeof module !== `undefined`) module.exports = { resolveStableMetadata };
