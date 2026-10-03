type GitWorktreeFilesDependencies = {
  queryKey: (root: string, host: any, type: string) => any;
  getQueryMeta: () => any;
  runGit: (
    cwd: string,
    args: string[],
    host: any,
    options?: Record<string, unknown>,
  ) => Promise<any>;
  utf8ByteLength: (value: string) => number;
};

function listGitWorktreeFiles(
  repository: any,
  dependencies: GitWorktreeFilesDependencies,
) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(
      repository.root,
      repository.host,
      `worktree-files`,
    ),
    gcTime: 250,
    meta: dependencies.getQueryMeta(),
    queryFn: () =>
      readStableGitWorktreeFiles(
        repository.root,
        repository.host,
        dependencies,
      ),
    staleTime: 250,
  });
}

async function readStableGitWorktreeFiles(
  root: string,
  host: any,
  dependencies: GitWorktreeFilesDependencies,
) {
  const indexPath = await resolveGitIndexPath(root, host, dependencies);
  if (indexPath == null)
    return readGitWorktreeFilesFallback(root, host, dependencies);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const before = await readGitIndexFingerprint(indexPath, host);
    if (before == null) break;
    const files = await readGitWorktreeFilesWithStatus(
      root,
      host,
      dependencies,
    );
    if ((await readGitIndexFingerprint(indexPath, host)) === before)
      return files;
  }
  return readGitWorktreeFilesFallback(root, host, dependencies);
}

async function readGitWorktreeFilesWithStatus(
  root: string,
  host: any,
  dependencies: GitWorktreeFilesDependencies,
) {
  const [tracked, untracked] = await Promise.all([
    dependencies.runGit(root, [`ls-files`, `--cached`, `-z`], host, {
      trim: false,
    }),
    readGitUntrackedFiles(root, host, dependencies),
  ]);
  if (!tracked.success) {
    const detail = tracked.stderr || tracked.stdout;
    throw Error(`git ls-files failed${detail ? `: ${detail}` : ``}`);
  }
  return [
    ...splitNullSeparatedPaths(tracked.stdout),
    ...untracked,
  ];
}

async function readGitWorktreeFilesFallback(
  root: string,
  host: any,
  dependencies: GitWorktreeFilesDependencies,
) {
  const result = await dependencies.runGit(
    root,
    [`ls-files`, `--cached`, `--others`, `--exclude-standard`, `-z`],
    host,
    { trim: false },
  );
  if (!result.success) {
    const detail = result.stderr || result.stdout;
    throw Error(`git ls-files failed${detail ? `: ${detail}` : ``}`);
  }
  return splitNullSeparatedPaths(result.stdout);
}

async function readGitUntrackedFiles(
  root: string,
  host: any,
  dependencies: GitWorktreeFilesDependencies,
) {
  const status = await dependencies.runGit(
    root,
    [
      `status`,
      `--no-renames`,
      `--porcelain=v1`,
      `-z`,
      `--untracked-files=normal`,
    ],
    host,
    { trim: false, timeoutMs: null },
  );
  if (!status.success) {
    const detail = status.stderr || status.stdout;
    throw Error(`git status failed${detail ? `: ${detail}` : ``}`);
  }
  const paths = splitNullSeparatedPaths(status.stdout)
    .filter((entry) => entry.startsWith(`?? `))
    .map((entry) => entry.slice(3));
  const directories = paths.filter((entry) => entry.endsWith(`/`));
  if (directories.length === 0) return paths;

  const expanded: string[] = [];
  for (const pathspecs of batchGitLiteralPathspecs(
    directories,
    dependencies.utf8ByteLength,
  )) {
    const result = await dependencies.runGit(
      root,
      [`ls-files`, `--others`, `--exclude-standard`, `-z`, `--`, ...pathspecs],
      host,
      { trim: false, timeoutMs: null },
    );
    if (!result.success) {
      const detail = result.stderr || result.stdout;
      throw Error(`git ls-files failed${detail ? `: ${detail}` : ``}`);
    }
    expanded.push(...splitNullSeparatedPaths(result.stdout));
  }
  return [...paths.filter((entry) => !entry.endsWith(`/`)), ...expanded];
}

async function resolveGitIndexPath(
  root: string,
  host: any,
  dependencies: GitWorktreeFilesDependencies,
) {
  const result = await dependencies.runGit(
    root,
    [`rev-parse`, `--git-path`, `index`],
    host,
  );
  if (!result.success || result.stdout.length === 0) return null;
  const path = await host.platformPath();
  return path.isAbsolute(result.stdout)
    ? result.stdout
    : path.resolve(root, result.stdout);
}

async function readGitIndexFingerprint(indexPath: string, host: any) {
  try {
    const stat = await host.stat(indexPath, { bypassCache: true });
    return [stat.size ?? 0, stat.mtimeMs, stat.ctimeMs, stat.ino ?? 0].join(
      `:`,
    );
  } catch (error) {
    return typeof error === `object` &&
      error != null &&
      `code` in error &&
      error.code === `ENOENT`
      ? `missing`
      : null;
  }
}

function batchGitLiteralPathspecs(
  paths: string[],
  utf8ByteLength: (value: string) => number,
) {
  const batches: string[][] = [];
  let batch: string[] = [];
  let batchBytes = 0;
  for (const path of paths) {
    const pathspec = `:(literal)${path}`;
    const bytes = utf8ByteLength(pathspec) + 1;
    if (batch.length > 0 && batchBytes + bytes > 8000) {
      batches.push(batch);
      batch = [];
      batchBytes = 0;
    }
    batch.push(pathspec);
    batchBytes += bytes;
  }
  if (batch.length > 0) batches.push(batch);
  return batches;
}

function splitNullSeparatedPaths(output: string) {
  return output.split(`\0`).filter((entry) => entry.length > 0);
}

export {
  batchGitLiteralPathspecs,
  listGitWorktreeFiles,
  readGitIndexFingerprint,
  readGitUntrackedFiles,
  readGitWorktreeFilesFallback,
  readGitWorktreeFilesWithStatus,
  readStableGitWorktreeFiles,
  resolveGitIndexPath,
  splitNullSeparatedPaths,
};
if (typeof module !== `undefined`)
  module.exports = {
    batchGitLiteralPathspecs,
    listGitWorktreeFiles,
    readGitIndexFingerprint,
    readGitUntrackedFiles,
    readGitWorktreeFilesFallback,
    readGitWorktreeFilesWithStatus,
    readStableGitWorktreeFiles,
    resolveGitIndexPath,
    splitNullSeparatedPaths,
  };
