type GitPathDependencies = {
  queryKey: (...parts: any[]) => any;
  runGit: (root: string, args: string[], host: any, options: any) => Promise<any>;
  staleTime: number;
};

const sharedIndexCache = new WeakMap<any, any>();

function getGitDir(
  repository: any,
  signal: AbortSignal | undefined,
  dependencies: GitPathDependencies,
) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(repository.root, repository.host, `git-dir`),
    queryFn: async () => {
      const result = await dependencies.runGit(
        repository.root,
        [`rev-parse`, `--git-dir`],
        repository.host,
        { signal },
      );
      if (!result.success || !result.stdout) return null;
      const platformPath = await repository.host.platformPath();
      return platformPath.isAbsolute(result.stdout)
        ? result.stdout
        : platformPath.join(repository.root, result.stdout);
    },
    staleTime: dependencies.staleTime,
  });
}

function resolveGitPath(
  repository: any,
  path: string,
  signal: AbortSignal | undefined,
  dependencies: GitPathDependencies,
) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(repository.root, repository.host, `git-path`, path),
    queryFn: async () => {
      const result = await dependencies.runGit(
        repository.root,
        [`rev-parse`, `--git-path`, path],
        repository.host,
        { signal },
      );
      if (!result.success || !result.stdout) return null;
      const platformPath = await repository.host.platformPath();
      if (platformPath.isAbsolute(result.stdout)) return result.stdout;
      if (result.stdout.startsWith(`.git/`))
        return platformPath.join(repository.root, result.stdout);
      const gitDir = await getGitDir(repository, signal, dependencies);
      return gitDir ? platformPath.join(gitDir, result.stdout) : null;
    },
    staleTime: dependencies.staleTime,
  });
}

function getIndexPath(repository: any, dependencies: GitPathDependencies) {
  return resolveGitPath(repository, `index`, undefined, dependencies);
}

async function readIndexFingerprint(indexPath: string, repository: any) {
  try {
    const stat = await repository.host.stat(indexPath, { bypassCache: true });
    return [stat.size ?? 0, stat.mtimeMs ?? 0, stat.ctimeMs ?? 0, stat.ino ?? 0].join(`:`);
  } catch (error) {
    return typeof error === `object` && error && `code` in error && error.code === `ENOENT`
      ? `missing`
      : null;
  }
}

async function readSharedIndexPath(
  repository: any,
  signal: AbortSignal | undefined,
  dependencies: GitPathDependencies,
) {
  const result = await dependencies.runGit(
    repository.root,
    [`rev-parse`, `--shared-index-path`],
    repository.host,
    { signal },
  );
  if (!result.success) return undefined;
  if (!result.stdout) return null;
  const platformPath = await repository.host.platformPath();
  return platformPath.isAbsolute(result.stdout)
    ? result.stdout
    : platformPath.resolve(repository.root, result.stdout);
}

async function resolveSharedIndexPath(
  repository: any,
  indexPath: string,
  signal: AbortSignal | undefined,
  dependencies: GitPathDependencies,
) {
  const fingerprint = await readIndexFingerprint(indexPath, repository);
  if (fingerprint == null)
    return (await readSharedIndexPath(repository, signal, dependencies)) ?? null;
  const cached = sharedIndexCache.get(repository);
  if (cached?.indexPath === indexPath && cached.indexFingerprint === fingerprint)
    return cached.sharedIndexPath;
  const sharedIndexPath = await readSharedIndexPath(repository, signal, dependencies);
  if (sharedIndexPath !== undefined)
    sharedIndexCache.set(repository, {
      indexFingerprint: fingerprint,
      indexPath,
      sharedIndexPath,
    });
  return sharedIndexPath ?? null;
}

async function getIndexContext(
  repository: any,
  signal: AbortSignal | undefined,
  dependencies: GitPathDependencies,
) {
  const indexPath = await getIndexPath(repository, dependencies);
  return indexPath
    ? {
        indexPath,
        sharedIndexPath: await resolveSharedIndexPath(
          repository,
          indexPath,
          signal,
          dependencies,
        ),
      }
    : null;
}

export {
  getGitDir,
  getIndexContext,
  getIndexPath,
  readIndexFingerprint,
  readSharedIndexPath,
  resolveGitPath,
  resolveSharedIndexPath,
};
if (typeof module !== `undefined`)
  module.exports = {
    getGitDir,
    getIndexContext,
    getIndexPath,
    readIndexFingerprint,
    readSharedIndexPath,
    resolveGitPath,
    resolveSharedIndexPath,
  };
