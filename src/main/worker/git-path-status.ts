type PathStatusDependencies = {
  chunk: <T>(values: T[], size: number) => T[][];
  compact: <T>(values: Array<T | null | undefined | false>) => T[];
  getQueryMeta: () => any;
  queryKey: (...parts: any[]) => any;
  runGit: (root: string, args: string[], host: any, options?: any) => Promise<any>;
};

import { parsePathStatusOutput } from './git-path-status-policy';

const PATH_QUERY_CACHE_MS = 250;
const NESTED_DIRECTORY_BATCH_SIZE = 8;

async function expandUntrackedDirectories(
  root: string,
  host: any,
  directories: string[],
  signal: AbortSignal | undefined,
  dependencies: PathStatusDependencies,
) {
  if (directories.length === 0) return { success: true, paths: [], gitRoot: root };
  const result = await dependencies.runGit(
    root,
    [`ls-files`, `--others`, `--exclude-standard`, `-z`, `--`, ...directories],
    host,
    { signal, trim: false },
  );
  if (!result.success) return { success: false, paths: [], gitRoot: root };
  const paths = result.stdout.split(`\0`).filter((path: string) => path.length > 0);
  const directoryPaths = paths.filter((path: string) => path.endsWith(`/`));
  if (directoryPaths.length === 0) return { success: true, paths, gitRoot: root };
  const platformPath = await host.platformPath();
  const nestedRepositories = new Set<string>();
  for (const batch of dependencies.chunk<string>(directoryPaths, NESTED_DIRECTORY_BATCH_SIZE)) {
    if (signal?.aborted) return { success: false, paths: [], gitRoot: root };
    const nested = await Promise.all(
      batch.map(async (path) =>
        (
          await dependencies.runGit(
            platformPath.join(root, path),
            [`rev-parse`, `--verify`, `--quiet`, `HEAD^{commit}`],
            host,
            { allowedNonZeroExitCodes: [1], signal },
          )
        ).code === 1
          ? path
          : null,
      ),
    );
    for (const path of dependencies.compact<string>(nested)) nestedRepositories.add(path);
  }
  return signal?.aborted
    ? { success: false, paths: [], gitRoot: root }
    : {
        success: true,
        gitRoot: root,
        paths: paths.flatMap((path: string) =>
          nestedRepositories.has(path) ? [] : path.endsWith(`/`) ? [path.slice(0, -1)] : [path],
        ),
      };
}

async function readUntrackedPaths(
  root: string,
  host: any,
  options: {
    configOverrides?: any[];
    onStatus?: (status: string) => void;
    signal?: AbortSignal;
  } = {},
  dependencies: PathStatusDependencies,
) {
  const { configOverrides = [], onStatus, signal } = options;
  const result = await dependencies.runGit(
    root,
    [
      `status`,
      onStatus == null ? `--no-renames` : `--renames`,
      `--porcelain=v1`,
      `-z`,
      `--untracked-files=normal`,
    ],
    host,
    { configOverrides, signal, trim: false },
  );
  if (!result.success) return { success: false, paths: [], gitRoot: root };
  onStatus?.(result.stdout);
  const paths: string[] = [];
  const entries = result.stdout.split(`\0`);
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (entry == null) continue;
    if (entry.startsWith(`?? `)) paths.push(entry.slice(3));
    else if (/[RC]/.test(entry.slice(0, 2))) index += 1;
  }
  const expanded = await expandUntrackedDirectories(
    root,
    host,
    paths.filter((path) => path.endsWith(`/`)),
    signal,
    dependencies,
  );
  return expanded.success
    ? {
        success: true,
        gitRoot: root,
        paths: [...paths.filter((path) => !path.endsWith(`/`)), ...expanded.paths],
      }
    : expanded;
}

async function readTrackedPaths(
  repository: any,
  paths: string[],
  dependencies: PathStatusDependencies,
) {
  const result = await dependencies.runGit(
    repository.root,
    [`ls-files`, `--cached`, `-z`, `--`, ...paths],
    repository.host,
    { trim: false },
  );
  return result.success
    ? {
        success: true,
        paths: result.stdout.split(`\0`).filter((path: string) => path.length > 0),
        gitRoot: repository.root,
      }
    : { success: false, paths: [], gitRoot: repository.root };
}

function getTrackedPaths(repository: any, paths: string[], dependencies: PathStatusDependencies) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(repository.root, repository.host, `tracked-paths`, paths),
    gcTime: PATH_QUERY_CACHE_MS,
    meta: dependencies.getQueryMeta(),
    queryFn: () => readTrackedPaths(repository, paths, dependencies),
    staleTime: PATH_QUERY_CACHE_MS,
  });
}

async function readPathStatus(
  repository: any,
  paths: string[],
  dependencies: PathStatusDependencies,
) {
  const result = await dependencies.runGit(
    repository.root,
    [
      `status`,
      `--no-renames`,
      `--ignored=matching`,
      `--untracked-files=all`,
      `--porcelain=v1`,
      `-z`,
      `--`,
      ...paths,
    ],
    repository.host,
    { trim: false },
  );
  if (!result.success)
    return {
      success: false,
      trackedPaths: [],
      untrackedPaths: [],
      ignoredPaths: [],
      gitRoot: repository.root,
    };
  const { trackedPaths, untrackedPaths, ignoredPaths } = parsePathStatusOutput(result.stdout);
  return {
    success: true,
    trackedPaths,
    untrackedPaths,
    ignoredPaths,
    gitRoot: repository.root,
  };
}

function getPathStatus(repository: any, paths: string[], dependencies: PathStatusDependencies) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(repository.root, repository.host, `path-status`, paths),
    gcTime: PATH_QUERY_CACHE_MS,
    meta: dependencies.getQueryMeta(),
    queryFn: () => readPathStatus(repository, paths, dependencies),
    staleTime: PATH_QUERY_CACHE_MS,
  });
}

export {
  NESTED_DIRECTORY_BATCH_SIZE,
  PATH_QUERY_CACHE_MS,
  expandUntrackedDirectories,
  getPathStatus,
  getTrackedPaths,
  readPathStatus,
  readTrackedPaths,
  readUntrackedPaths,
};
if (typeof module !== `undefined`)
  module.exports = {
    NESTED_DIRECTORY_BATCH_SIZE,
    PATH_QUERY_CACHE_MS,
    expandUntrackedDirectories,
    getPathStatus,
    getTrackedPaths,
    readPathStatus,
    readTrackedPaths,
    readUntrackedPaths,
  };
