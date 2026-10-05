type GitReviewSectionChangesDependencies = {
  applyPatch: (
    params: any,
    gitManager: any,
    host: any,
    options: any,
  ) => Promise<any>;
  getReviewDiff: (
    reviewSnapshot: any,
    source: string,
    files: any[],
    options: any,
  ) => Promise<any>;
  getReviewFiles: (params: any) => Promise<any>;
  invalidateUntrackedPathsCache: (repository: any) => void;
  normalizeCwd: (cwd: string) => string;
  normalizePathFromRoot: (
    platformPath: any,
    sourceRoot: string,
    targetRoot: string,
    filePath: string,
  ) => string;
  runGit: (
    cwd: string,
    args: string[],
    host: any,
    options: any,
  ) => Promise<any>;
};
import {
  extractGitlinkSha,
  resolveReviewActionPath as resolveReviewActionPathPolicy,
  reviewSectionChangeError,
} from './git-review-section-policy';

async function findCleanGitlinkPaths(
  { gitlinks, host, path, repoRoot, signal }: any,
  dependencies: GitReviewSectionChangesDependencies,
) {
  const paths = await Promise.all(
    gitlinks.map(async (gitlink: any) => {
      const gitlinkPath = path.join(repoRoot, gitlink.path);
      const [head, status] = await Promise.all([
        dependencies.runGit(gitlinkPath, [`rev-parse`, `HEAD`], host, {
          signal,
        }),
        dependencies.runGit(
          gitlinkPath,
          [
            `status`,
            `--porcelain=v1`,
            `--untracked-files=all`,
            `--ignored=matching`,
          ],
          host,
          { signal },
        ),
      ]);
      return !head.success ||
        !status.success ||
        head.stdout.trim() !== gitlink.sha ||
        status.stdout.trim().length > 0
        ? null
        : gitlinkPath;
    }),
  );
  return paths.some((gitlinkPath) => gitlinkPath == null)
    ? null
    : paths.filter((gitlinkPath) => gitlinkPath != null);
}

function resolveReviewActionPath(
  platformPath: any,
  repoRoot: string,
  cwd: string,
  filePath: string,
  dependencies: GitReviewSectionChangesDependencies,
) {
  return resolveReviewActionPathPolicy(
    platformPath,
    repoRoot,
    cwd,
    filePath,
    dependencies.normalizePathFromRoot,
  );
}

function applyReviewPatch(
  { host, diff, gitManager, repoRoot, revert, signal, target }: any,
  dependencies: GitReviewSectionChangesDependencies,
) {
  return dependencies.applyPatch(
    {
      allowBinary: true,
      atomic: true,
      cwd: repoRoot,
      diff,
      revert,
      target,
    },
    gitManager,
    host,
    { signal },
  );
}

async function applyReviewSectionChanges(
  { action, host, cwd, files, gitManager, signal, source }: any,
  dependencies: GitReviewSectionChangesDependencies,
) {
  const repository = await gitManager.getWorktreeRepository(
    dependencies.normalizeCwd(cwd),
    host,
  );
  if (repository?.root == null)
    return reviewSectionChangeError(`not-git-repo`);

  const platformPath = await host.platformPath();
  const normalizedFiles = files.map((file: any) => ({
    ...file,
    path: resolveReviewActionPath(
      platformPath,
      repository.root,
      cwd,
      file.path,
      dependencies,
    ),
  }));
  if (normalizedFiles.length === 0) return reviewSectionChangeError();

  dependencies.invalidateUntrackedPathsCache(repository);
  repository.clearShortLivedGitReadCaches();
  const reviewDiff = await dependencies
    .getReviewDiff(
      repository.reviewSnapshot,
      source,
      normalizedFiles,
      { binary: true },
    )
    .catch(() => null);
  if (reviewDiff == null) return reviewSectionChangeError();

  repository.clearShortLivedGitReadCaches();
  const reviewFiles = await dependencies.getReviewFiles({
    paths: [
      ...new Set(
        normalizedFiles.flatMap((file: any) =>
          file.previousPath == null
            ? [file.path]
            : [file.path, file.previousPath],
        ),
      ),
    ],
    source,
    worktreeRepo: repository,
  });
  const revisions =
    reviewFiles.type === `success`
      ? new Map(
          reviewFiles.files.map((file: any) => [file.path, file.revision]),
        )
      : null;
  if (
    revisions == null ||
    normalizedFiles.some(
      (file: any) => revisions.get(file.path) !== file.revision,
    )
  )
    return reviewSectionChangeError();

  const diffs = normalizedFiles.flatMap((file: any) => {
    const result = reviewDiff.diffs[file.path];
    return result?.type === `success` ? [result.diff] : [];
  });
  const gitlinks = normalizedFiles.flatMap((file: any) => {
    const result = reviewDiff.diffs[file.path];
    const sha =
      file.changeKind === `untracked` && result?.type === `success`
        ? extractGitlinkSha(result.diff)
        : null;
    return sha == null ? [] : [{ path: file.path, sha }];
  });
  const diff = diffs.join(``);
  if (diffs.length !== normalizedFiles.length || diff.trim().length === 0)
    return reviewSectionChangeError();

  switch (action) {
    case `stage`:
      return applyReviewPatch(
        {
          host,
          diff,
          gitManager,
          repoRoot: repository.root,
          signal,
          target: `staged`,
        },
        dependencies,
      );
    case `unstage`:
      return applyReviewPatch(
        {
          host,
          diff,
          gitManager,
          repoRoot: repository.root,
          revert: true,
          signal,
          target: `staged`,
        },
        dependencies,
      );
    case `revert`: {
      if (source === `staged`) {
        const stagedResult = await applyReviewPatch(
          {
            host,
            diff,
            gitManager,
            repoRoot: repository.root,
            revert: true,
            signal,
            target: `staged`,
          },
          dependencies,
        );
        if (stagedResult.status !== `success`) return stagedResult;
        const unstagedResult = await applyReviewPatch(
          {
            host,
            diff,
            gitManager,
            repoRoot: repository.root,
            revert: true,
            signal,
            target: `unstaged`,
          },
          dependencies,
        );
        return unstagedResult.status === `success`
          ? unstagedResult
          : { ...unstagedResult, status: `partial-success` };
      }

      const gitlinkPaths = await findCleanGitlinkPaths(
        {
          gitlinks,
          host,
          path: platformPath,
          repoRoot: repository.root,
          signal,
        },
        dependencies,
      );
      if (gitlinkPaths == null)
        return {
          ...reviewSectionChangeError(),
          skippedPaths: gitlinks.map((gitlink: any) => gitlink.path),
        };
      const result = await applyReviewPatch(
        {
          host,
          diff,
          gitManager,
          repoRoot: repository.root,
          revert: true,
          signal,
          target: `unstaged`,
        },
        dependencies,
      );
      if (result.status !== `success` || gitlinkPaths.length === 0)
        return result;
      try {
        await Promise.all(
          gitlinkPaths.map((gitlinkPath) =>
            host.remove(gitlinkPath, { recursive: true, force: true }),
          ),
        );
        dependencies.invalidateUntrackedPathsCache(repository);
        return result;
      } catch {
        return {
          ...result,
          status: `partial-success`,
          skippedPaths: [
            ...result.skippedPaths,
            ...gitlinks.map((gitlink: any) => gitlink.path),
          ],
        };
      }
    }
  }
}

export {
  applyReviewPatch,
  applyReviewSectionChanges,
  extractGitlinkSha,
  findCleanGitlinkPaths,
  resolveReviewActionPath,
  reviewSectionChangeError,
};

if (typeof module !== `undefined`)
  module.exports = {
    applyReviewPatch,
    applyReviewSectionChanges,
    extractGitlinkSha,
    findCleanGitlinkPaths,
    resolveReviewActionPath,
    reviewSectionChangeError,
  };
