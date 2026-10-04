type GitInitWatcherRecoveryDependencies = {
  stat: (path: string, options: { bypassCache: boolean }) => Promise<any>;
  isMissingPathError: (error: unknown) => boolean;
};

/**
 * Decide whether a failed metadata watcher can safely keep the workspace-root
 * watcher alive.  The root watcher is sufficient while `.git` is absent, but
 * a stat failure for an existing directory must still tear down the session.
 */
async function isGitMetadataDirectoryUnavailable(
  gitDirectoryPath: string,
  deps: GitInitWatcherRecoveryDependencies,
): Promise<boolean> {
  try {
    const metadata = await deps.stat(gitDirectoryPath, { bypassCache: true });
    return metadata?.isDirectory?.() !== true;
  } catch (error) {
    return deps.isMissingPathError(error);
  }
}

export { isGitMetadataDirectoryUnavailable };
if (typeof module !== `undefined`)
  module.exports = { isGitMetadataDirectoryUnavailable };
