import {
  isGitInternalPath,
  isWatchedRefPath,
  isWorktreeTopologyPath,
} from "./git-watch-paths";

type PathApi = {
  dirname(path: string): string;
  join(...parts: string[]): string;
};

type BranchState =
  | { type: `branch`; branch: string }
  | { type: `detached` }
  | { type: `unknown` };

type PrefetchedMetadata = {
  gitDir: string | null;
  headPath: string | null;
  headRef: string | null;
  indexPath: string | null;
  syncedBranchPath: string | null;
};

type WatchTarget = {
  metadataDirectory?: { parentPath: string; missing: boolean } | null;
  watchPath: string;
};

type StartGitRepoWatcherDependencies = {
  isDisposed: () => boolean;
  logStart: () => void;
  getTargets: () => WatchTarget[];
  retryInactiveTargets: () => Promise<void>;
  getPlatformPath: () => Promise<PathApi>;
  setPathApi: (pathApi: PathApi) => void;
  trace: <T>(
    span: { attributes: Record<string, string | number>; name: string; op: string },
    operation: () => Promise<T>,
  ) => Promise<T>;
  hostKind: `local` | `remote`;
  prefetchMetadata: () => Promise<PrefetchedMetadata | null>;
  loadFallbackMetadata: () => Promise<[
    string | null,
    string | null,
    string | null,
    string | null,
    BranchState,
  ]>;
  commonDir: string;
  root: string;
  setGitDir: (gitDir: string | null) => void;
  setHeadRefState: (path: string | null, known: boolean) => void;
  addWatchTarget: (pathApi: PathApi, path: string | null, changeType: string) => WatchTarget | void;
  addDirectoryWatchTarget: (
    path: string,
    changeType: string,
    shouldHandleChangedPath: (path: string, cache: Map<string, boolean>) => boolean,
    recursive?: boolean,
    parentPath?: string,
  ) => WatchTarget | void;
  isHeadRefPath: (
    pathApi: PathApi,
    headsPath: string,
    path: string,
    cache: Map<string, boolean>,
  ) => boolean;
  startSession: (target: WatchTarget, recovering: boolean) => Promise<unknown>;
  refreshMetadata: (paths: string[], recovering: boolean) => Promise<void>;
};

const WORKTREE_METADATA_MARKERS = new Set([`HEAD`, `commondir`, `gitdir`, `locked`]);

/** Owns GitRepoWatcher initial metadata discovery, target topology, and first session startup. */
async function startGitRepoWatcher(input: StartGitRepoWatcherDependencies): Promise<void> {
  if (input.isDisposed()) return;
  input.logStart();

  if (input.getTargets().length > 0) {
    await input.retryInactiveTargets();
    return;
  }

  const pathApi = await input.getPlatformPath();
  input.setPathApi(pathApi);
  const [headPath, indexPath, syncedBranchPath, gitDir, branchState] = await input.trace(
    {
      attributes: { "git.host_kind": input.hostKind },
      name: `git.watcher_metadata`,
      op: `codex.git.watcher_metadata`,
    },
    async () => {
      const prefetched = await input.prefetchMetadata();
      if (prefetched == null) return input.loadFallbackMetadata();
      return [
        prefetched.headPath,
        prefetched.indexPath,
        prefetched.syncedBranchPath,
        prefetched.gitDir,
        prefetched.headRef == null
          ? { type: `detached` as const }
          : { type: `branch` as const, branch: prefetched.headRef.slice(11) },
      ];
    },
  );
  if (input.isDisposed()) return;

  input.setGitDir(gitDir);
  const currentHeadRefPath = branchState.type === `branch`
    ? pathApi.join(input.commonDir, `refs`, `heads`, ...branchState.branch.split(`/`))
    : null;
  input.setHeadRefState(currentHeadRefPath, branchState.type !== `unknown`);
  input.addWatchTarget(pathApi, headPath, `head`);

  const commonHeadPath = pathApi.join(input.commonDir, `HEAD`);
  if (commonHeadPath !== headPath) input.addWatchTarget(pathApi, commonHeadPath, `head`);
  input.addWatchTarget(pathApi, indexPath, `index`);
  input.addWatchTarget(pathApi, pathApi.join(input.commonDir, `FETCH_HEAD`), `remote-refs`);
  input.addWatchTarget(pathApi, pathApi.join(input.commonDir, `packed-refs`), `remote-refs`);

  const headsPath = pathApi.join(input.commonDir, `refs`, `heads`);
  const refsPath = pathApi.join(input.commonDir, `refs`);
  input.addDirectoryWatchTarget(refsPath, `head`, (path) => path === headsPath, false, input.commonDir);
  input.addDirectoryWatchTarget(refsPath, `local-refs`, (path) => path === headsPath, false, input.commonDir);
  input.addDirectoryWatchTarget(
    headsPath,
    `head`,
    (path, cache) => isWatchedRefPath(pathApi as any, headsPath, path) && input.isHeadRefPath(pathApi, headsPath, path, cache),
    true,
    refsPath,
  );
  input.addDirectoryWatchTarget(
    headsPath,
    `local-refs`,
    (path, cache) => isWatchedRefPath(pathApi as any, headsPath, path) && !input.isHeadRefPath(pathApi, headsPath, path, cache),
    true,
    refsPath,
  );

  const remotesPath = pathApi.join(refsPath, `remotes`);
  input.addDirectoryWatchTarget(refsPath, `remote-refs`, (path) => path === remotesPath, false, input.commonDir);
  input.addDirectoryWatchTarget(
    remotesPath,
    `remote-refs`,
    (path) => isWatchedRefPath(pathApi as any, remotesPath, path),
    true,
    refsPath,
  );
  input.addWatchTarget(pathApi, pathApi.join(input.commonDir, `config`), `config`);
  input.addWatchTarget(pathApi, pathApi.join(input.commonDir, `shallow`), `config`);

  const infoPath = pathApi.join(input.commonDir, `info`);
  const excludePath = pathApi.join(infoPath, `exclude`);
  const attributesPath = pathApi.join(infoPath, `attributes`);
  input.addDirectoryWatchTarget(
    infoPath,
    `config`,
    (path) => path === excludePath || path === attributesPath,
    false,
    input.commonDir,
  );
  if (gitDir != null) input.addWatchTarget(pathApi, pathApi.join(gitDir, `config.worktree`), `config`);
  input.addWatchTarget(pathApi, syncedBranchPath, `synced-branch`);

  const worktreesPath = pathApi.join(input.commonDir, `worktrees`);
  input.addDirectoryWatchTarget(
    input.commonDir,
    `worktree-topology`,
    (path) => path === worktreesPath,
    false,
  );
  input.addDirectoryWatchTarget(
    worktreesPath,
    `worktree-topology`,
    (path) => isWorktreeTopologyPath(pathApi as any, worktreesPath, path, WORKTREE_METADATA_MARKERS),
    false,
    input.commonDir,
  );
  input.addDirectoryWatchTarget(
    input.root,
    `working-tree`,
    (path) => !isGitInternalPath(pathApi as any, input.commonDir, input.root, path),
  );

  if (gitDir != null && pathApi.dirname(gitDir) === worktreesPath) {
    const target = input.getTargets().find((candidate) => candidate.watchPath === gitDir);
    if (target != null) target.metadataDirectory = { parentPath: worktreesPath, missing: false };
  }

  await input.trace(
    {
      attributes: {
        "git.host_kind": input.hostKind,
        "git.watcher_target_count": input.getTargets().length,
      },
      name: `git.watcher_targets`,
      op: `codex.git.watcher_targets`,
    },
    () => Promise.all(input.getTargets().map((target) => input.startSession(target, false))),
  );
  await input.refreshMetadata([], false);
}

export { startGitRepoWatcher };
if (typeof module !== `undefined`) module.exports = { startGitRepoWatcher };
