type ReviewFileDiffDependencies = {
  collectProcessResult: (process: any) => Promise<any>;
  getQueryMeta: () => any;
  parseGitError: (result: any) => any;
  quoteGitDiffPath: (path: string) => string;
  runGit: (
    root: string,
    args: string[],
    host: any,
    options?: Record<string, unknown>,
  ) => Promise<any>;
};

import {
  buildUntrackedSubmoduleDiff,
  buildUntrackedSymlinkDiff,
} from './git-review-file-diff-policy';

function getGitBlobDiff(
  reviewSnapshot: any,
  oldRef: string,
  newRef: string,
  { binary = false, hideWhitespace = false } = {},
  dependencies: ReviewFileDiffDependencies,
) {
  const { worktreeRepo } = reviewSnapshot;
  const args = [
    ...(hideWhitespace ? [`--ignore-all-space`] : []),
    `--full-index`,
    oldRef,
    newRef,
  ];
  return worktreeRepo.queryClient.fetchQuery({
    queryKey: reviewSnapshot.queryKey(
      `review-blob-diff`,
      ...(binary ? [`binary`] : []),
      args,
    ),
    gcTime: 250,
    meta: dependencies.getQueryMeta(),
    queryFn: () =>
      reviewSnapshot.gitDiff(args, {
        allowedNonZeroExitCodes: [0, 1],
        binary,
        trim: false,
      }),
    staleTime: 250,
  });
}

function readWorkingTreeSymlink(
  reviewSnapshot: any,
  path: string,
  dependencies: ReviewFileDiffDependencies,
) {
  const { worktreeRepo } = reviewSnapshot;
  return worktreeRepo.queryClient.fetchQuery({
    queryKey: reviewSnapshot.queryKey(`review-working-tree-symlink`, path),
    gcTime: 250,
    meta: dependencies.getQueryMeta(),
    queryFn: () =>
      reviewSnapshot.read(async () => {
        const absolutePath = (await worktreeRepo.host.platformPath()).join(
          worktreeRepo.root,
          path,
        );
        const windows =
          (await worktreeRepo.host.platformFamily()) === `windows`;
        const result = await dependencies.collectProcessResult(
          await worktreeRepo.host.spawn({
            args: windows
              ? [
                  `powershell.exe`,
                  `-NoProfile`,
                  `-NonInteractive`,
                  `-Command`,
                  `[Console]::Out.Write((Get-Item -LiteralPath $args[0] -Force).Target)`,
                  absolutePath,
                ]
              : [`readlink`, absolutePath],
            cwd: worktreeRepo.root,
            outputBytesCap: 64000,
            signal: reviewSnapshot.signal,
            timeoutMs: 10000,
          }),
        );
        if (result.code !== 0)
          throw Error(`Failed to read working-tree symlink`);
        const target = windows
          ? result.stdout
          : result.stdout.replace(/\n$/, ``);
        const hash = await reviewSnapshot.git([`hash-object`, `--stdin`], {
          stdin: target,
        });
        if (!hash.success) throw Error(`Failed to hash working-tree symlink`);
        return { oid: hash.stdout.trim(), target };
      }),
    staleTime: 250,
  });
}

function getUntrackedWorkingTreeDiff(
  reviewSnapshot: any,
  path: string,
  { binary = false } = {},
  dependencies: ReviewFileDiffDependencies,
) {
  const { worktreeRepo } = reviewSnapshot;
  return worktreeRepo.queryClient.fetchQuery({
    queryKey: reviewSnapshot.queryKey(
      `review-untracked-diff`,
      ...(binary ? [`binary`] : []),
      path,
    ),
    gcTime: 250,
    meta: dependencies.getQueryMeta(),
    queryFn: () =>
      reviewSnapshot.read(async () => {
        const absolutePath = (await worktreeRepo.host.platformPath()).join(
          worktreeRepo.root,
          path,
        );
        const stat = await worktreeRepo.host.stat(absolutePath, {
          bypassCache: true,
          followSymlinks: false,
        });
        if (stat.isSymbolicLink()) {
          const { oid, target } = await readWorkingTreeSymlink(
            reviewSnapshot,
            path,
            dependencies,
          );
          const unifiedDiff = buildUntrackedSymlinkDiff(
            path, target, oid, dependencies.quoteGitDiffPath,
          );
          return {
            type: `success`,
            unifiedDiff,
            unifiedDiffBytes: Buffer.byteLength(unifiedDiff, `utf8`),
          };
        }
        if (stat.isDirectory()) {
          const result = await dependencies.runGit(
            absolutePath,
            [`rev-parse`, `--verify`, `HEAD^{commit}`],
            worktreeRepo.host,
            { signal: reviewSnapshot.signal },
          );
          if (!result.success)
            return { type: `error`, error: { type: `unknown` } };
          const sha = result.stdout.trim();
          const unifiedDiff = buildUntrackedSubmoduleDiff(
            path, sha, dependencies.quoteGitDiffPath,
          );
          return {
            type: `success`,
            unifiedDiff,
            unifiedDiffBytes: Buffer.byteLength(unifiedDiff, `utf8`),
          };
        }
        const result = await reviewSnapshot.gitDiff(
          [`--no-index`, `--`, `/dev/null`, path],
          {
            allowedNonZeroExitCodes: [0, 1],
            binary,
            trim: false,
          },
        );
        return result.outputLimitExceeded || !result.success
          ? { type: `error`, error: dependencies.parseGitError(result) }
          : {
              type: `success`,
              unifiedDiff: result.stdout,
              unifiedDiffBytes: result.stdoutBytes,
            };
      }),
    staleTime: 250,
  });
}

export { getGitBlobDiff, getUntrackedWorkingTreeDiff, readWorkingTreeSymlink };
if (typeof module !== `undefined`)
  module.exports = {
    getGitBlobDiff,
    getUntrackedWorkingTreeDiff,
    readWorkingTreeSymlink,
  };
