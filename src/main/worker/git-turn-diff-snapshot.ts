type TurnDiffSnapshotDependencies = {
  queryKey: (...parts: any[]) => any;
  getStatusConfig: (repository: any, signal: AbortSignal) => Promise<any>;
  runGit: (
    root: string,
    args: string[],
    host: any,
    options: any,
  ) => Promise<any>;
  getIndexPath: (
    repository: any,
    signal: AbortSignal,
  ) => Promise<string | null>;
  withTemporaryIndex: (
    indexPath: string,
    callback: (env: any) => Promise<string>,
    host: any,
  ) => Promise<string>;
  stageWorktree: (params: any) => Promise<any>;
  isObjectId: (value: string) => boolean;
  normalizeTreeSha: (value: string) => string;
};
import { parseTurnDiffStatus } from "./git-turn-diff-status-policy";

function normalizeTreeOutput(
  output: string,
  deps: TurnDiffSnapshotDependencies,
) {
  const treeSha = output.trim();
  if (!deps.isObjectId(treeSha)) throw Error(`Unexpected tree SHA: ${treeSha}`);
  return deps.normalizeTreeSha(treeSha);
}

async function readTurnDiffStatus(
  repository: any,
  signal: AbortSignal,
  deps: TurnDiffSnapshotDependencies,
) {
  const configOverrides = await deps.getStatusConfig(repository, signal);
  const result = await deps.runGit(
    repository.root,
    [
      `status`,
      `--no-renames`,
      `--porcelain=v1`,
      `-z`,
      `--untracked-files=normal`,
    ],
    repository.host,
    { configOverrides, signal, trim: false },
  );
  if (!result.success)
    throw Error(
      result.stderr || result.stdout || `Failed to read turn diff status`,
    );
  return parseTurnDiffStatus(result.stdout);
}

async function createTurnDiffSnapshotTree(
  repository: any,
  signal: AbortSignal,
  deps: TurnDiffSnapshotDependencies,
) {
  const { hasTrackedChanges, untrackedPaths } = await readTurnDiffStatus(
    repository,
    signal,
    deps,
  );
  if (!hasTrackedChanges && untrackedPaths.length === 0) {
    const headTree = await deps.runGit(
      repository.root,
      [`rev-parse`, `--verify`, `HEAD^{tree}`],
      repository.host,
      { allowedNonZeroExitCodes: [1, 128], signal },
    );
    if (headTree.code === 0) return normalizeTreeOutput(headTree.stdout, deps);
    if (!headTree.success)
      throw Error(
        headTree.stderr || headTree.stdout || `Failed to resolve HEAD tree`,
      );
  }
  const indexPath = await deps.getIndexPath(repository, signal);
  if (indexPath == null) throw Error(`Failed to resolve git index path`);
  return deps.withTemporaryIndex(
    indexPath,
    async (env) => {
      const staged = await deps.stageWorktree({
        gitRoot: repository.root,
        env,
        fallback: `error`,
        host: repository.host,
        includeTrackedChanges: hasTrackedChanges,
        signal,
        untrackedPathsPromise: Promise.resolve({
          success: true,
          gitRoot: repository.root,
          paths: untrackedPaths,
        }),
      });
      if (!staged.success)
        throw Error(
          staged.stderr ||
            staged.stdout ||
            `Failed to stage turn diff snapshot`,
        );
      const tree = await deps.runGit(
        repository.root,
        [`write-tree`],
        repository.host,
        { env, signal },
      );
      if (!tree.success)
        throw Error(
          tree.stderr || tree.stdout || `Failed to write turn diff snapshot`,
        );
      return normalizeTreeOutput(tree.stdout, deps);
    },
    repository.host,
  );
}

function captureTurnDiffSnapshotTree(
  repository: any,
  deps: TurnDiffSnapshotDependencies,
) {
  const snapshot = repository.reviewSnapshot;
  return repository.queryClient.fetchQuery({
    queryKey: deps.queryKey(
      repository.root,
      repository.host,
      `turn-diff-snapshot-tree`,
      `${snapshot.generation}`,
    ),
    gcTime: 250,
    queryFn: () =>
      snapshot.read(() =>
        createTurnDiffSnapshotTree(repository, snapshot.signal, deps),
      ),
    staleTime: 0,
  });
}

export {
  captureTurnDiffSnapshotTree,
  createTurnDiffSnapshotTree,
  normalizeTreeOutput,
  parseTurnDiffStatus,
  readTurnDiffStatus,
};
if (typeof module !== `undefined`)
  module.exports = {
    captureTurnDiffSnapshotTree,
    createTurnDiffSnapshotTree,
    normalizeTreeOutput,
    parseTurnDiffStatus,
    readTurnDiffStatus,
  };
