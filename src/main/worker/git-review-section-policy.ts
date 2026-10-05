function reviewSectionChangeError(errorCode?: string) {
  return {
    status: `error`,
    appliedPaths: [],
    skippedPaths: [],
    conflictedPaths: [],
    ...(errorCode == null ? {} : { errorCode }),
  };
}

function extractGitlinkSha(diff: string) {
  return /^new file mode 160000$/m.test(diff)
    ? (/^\+Subproject commit ([0-9a-f]{40,64})$/m.exec(diff)?.[1] ?? null)
    : null;
}

function resolveReviewActionPath(
  platformPath: any,
  repoRoot: string,
  cwd: string,
  filePath: string,
  normalizePathFromRoot: (
    platformPath: any,
    sourceRoot: string,
    targetRoot: string,
    filePath: string,
  ) => string,
) {
  const isRelativeToCwd =
    filePath.startsWith(`./`) ||
    filePath.startsWith(`../`) ||
    filePath.startsWith(`.\\`) ||
    filePath.startsWith(`..\\`);
  return normalizePathFromRoot(
    platformPath,
    repoRoot,
    isRelativeToCwd ? cwd : repoRoot,
    filePath,
  );
}

export {
  extractGitlinkSha,
  resolveReviewActionPath,
  reviewSectionChangeError,
};

if (typeof module !== `undefined`)
  module.exports = {
    extractGitlinkSha,
    resolveReviewActionPath,
    reviewSectionChangeError,
  };
