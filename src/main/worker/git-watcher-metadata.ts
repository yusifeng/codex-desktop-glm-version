type GitWatcherMetadataDependencies = {
  getSyncedBranchFileName: () => string;
  queryKey: (root: string, host: any, type: string, ...parts: string[]) => any;
  resolveGitPath: (repository: any, path: string) => Promise<string | null>;
  runGit: (
    root: string,
    args: string[],
    host: any,
    options: { signal?: AbortSignal },
  ) => Promise<{ success: boolean; stdout?: string | null }>;
};

function resolveGitWatcherHeadPath(
  repository: any,
  dependencies: GitWatcherMetadataDependencies,
) {
  return dependencies.resolveGitPath(repository, `HEAD`);
}

async function prefetchGitWatcherMetadata(
  repository: any,
  signal: AbortSignal | undefined,
  dependencies: GitWatcherMetadataDependencies,
) {
  const syncedBranchFileName = dependencies.getSyncedBranchFileName();
  const gitDirQuery = dependencies.queryKey(
    repository.root,
    repository.host,
    `git-dir`,
  );
  const headPathQuery = dependencies.queryKey(
    repository.root,
    repository.host,
    `git-path`,
    `HEAD`,
  );
  const indexPathQuery = dependencies.queryKey(
    repository.root,
    repository.host,
    `git-path`,
    `index`,
  );
  const syncedBranchPathQuery = dependencies.queryKey(
    repository.root,
    repository.host,
    `git-path`,
    syncedBranchFileName,
  );

  if (
    [gitDirQuery, headPathQuery, indexPathQuery, syncedBranchPathQuery].some(
      (query) => repository.queryClient.getQueryState(query) != null,
    )
  )
    return null;

  const result = await dependencies.runGit(
    repository.root,
    [
      `rev-parse`,
      `--git-dir`,
      `--git-path`,
      `HEAD`,
      `--git-path`,
      `index`,
      `--git-path`,
      syncedBranchFileName,
      `--symbolic-full-name`,
      `HEAD`,
    ],
    repository.host,
    { signal },
  );
  if (!result.success || !result.stdout) return null;

  const lines = result.stdout.split(/\r?\n/);
  if (
    lines.length !== 5 ||
    lines.some((line) => line.length === 0) ||
    (lines[4] !== `HEAD` &&
      (!lines[4].startsWith(`refs/heads/`) || lines[4] === `refs/heads/`))
  )
    return null;

  const path = await repository.host.platformPath();
  const gitDir = resolveGitDirectoryPath(path, repository.root, lines[0]);
  const metadata = {
    gitDir,
    headPath: resolveGitMetadataPath(path, repository.root, gitDir, lines[1]),
    headRef: lines[4].startsWith(`refs/heads/`) ? lines[4] : null,
    indexPath: resolveGitMetadataPath(path, repository.root, gitDir, lines[2]),
    syncedBranchPath: resolveGitMetadataPath(
      path,
      repository.root,
      gitDir,
      lines[3],
    ),
  };

  repository.queryClient.setQueryData(gitDirQuery, metadata.gitDir);
  repository.queryClient.setQueryData(headPathQuery, metadata.headPath);
  repository.queryClient.setQueryData(indexPathQuery, metadata.indexPath);
  repository.queryClient.setQueryData(
    syncedBranchPathQuery,
    metadata.syncedBranchPath,
  );
  return metadata;
}

function resolveGitDirectoryPath(path: any, root: string, gitDir: string) {
  return path.isAbsolute(gitDir) ? gitDir : path.join(root, gitDir);
}

function resolveGitMetadataPath(
  path: any,
  root: string,
  gitDir: string,
  metadataPath: string,
) {
  if (path.isAbsolute(metadataPath)) return metadataPath;
  return metadataPath.startsWith(`.git/`)
    ? path.join(root, metadataPath)
    : path.join(gitDir, metadataPath);
}

export {
  prefetchGitWatcherMetadata,
  resolveGitDirectoryPath,
  resolveGitMetadataPath,
  resolveGitWatcherHeadPath,
};
if (typeof module !== `undefined`)
  module.exports = {
    prefetchGitWatcherMetadata,
    resolveGitDirectoryPath,
    resolveGitMetadataPath,
    resolveGitWatcherHeadPath,
  };
