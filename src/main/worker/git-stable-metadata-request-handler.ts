type StableMetadataDependencies = {
  gitManager: { getStableMetadata: (cwd: unknown, host: any) => Promise<any> };
  host: any;
  ensureWatchingForGitInit: (cwd: unknown, host: any) => Promise<unknown>;
  disposeGitInitWatcher: (cwd: unknown, host: any) => void;
  encodeResult: (value: unknown) => unknown;
};

import { resolveStableMetadataWatcherAction } from './git-stable-metadata-policy';

/** Resolve repository metadata while preserving the Git-init watcher protocol. */
async function resolveStableMetadata(params: { cwd: unknown; watchForGitInit?: boolean }, deps: StableMetadataDependencies) {
  const metadata = await deps.gitManager.getStableMetadata(params.cwd, deps.host);
  const action = resolveStableMetadataWatcherAction(metadata != null, params.watchForGitInit);
  if (metadata == null) {
    if (action === `ensure`) await deps.ensureWatchingForGitInit(params.cwd, deps.host);
    else if (action === `dispose`) deps.disposeGitInitWatcher(params.cwd, deps.host);
    return deps.encodeResult(null);
  }
  if (action === `dispose`) deps.disposeGitInitWatcher(params.cwd, deps.host);
  return deps.encodeResult({ commonDir: metadata.commonDir, root: metadata.root });
}

export { resolveStableMetadata };
if (typeof module !== `undefined`) module.exports = { resolveStableMetadata };
