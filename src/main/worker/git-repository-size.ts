type RepositorySizeDependencies = {
  getQueryMeta: () => any;
  queryKey: (root: string, host: any, type: string) => any;
  runGit: (root: string, args: string[], host: any) => Promise<any>;
};

const MAX_WORKTREE_SNAPSHOT_REPOSITORY_BYTES = 200 * 1024 * 1024;

function formatByteSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = [`KB`, `MB`, `GB`, `TB`];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

function parseCountObjects(output: string) {
  const values = new Map<string, number>();
  for (const line of output.split(/\r?\n/)) {
    const entry = line.trim();
    if (!entry) continue;
    const [key, rawValue] = entry.split(`:`);
    if (!key || rawValue == null) continue;
    const value = Number.parseInt(rawValue.trim(), 10);
    if (Number.isFinite(value)) values.set(key, value);
  }
  return values;
}

async function runGitChecked(
  root: string,
  args: string[],
  host: any,
  dependencies: Pick<RepositorySizeDependencies, `runGit`>,
) {
  const result = await dependencies.runGit(root, args, host);
  if (!result.success) {
    const detail = result.stderr || result.stdout;
    throw Error(`git ${args.join(` `)} failed${detail ? `: ${detail}` : ``}`);
  }
  return result.stdout;
}

function readRepositoryCountObjects(
  repository: any,
  dependencies: RepositorySizeDependencies,
) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(repository.root, repository.host, `count-objects`),
    gcTime: 250,
    meta: dependencies.getQueryMeta(),
    queryFn: async () => {
      const result = await dependencies.runGit(
        repository.root,
        [`count-objects`, `-v`],
        repository.host,
      );
      if (!result.success) {
        const detail = result.stderr || result.stdout;
        throw Error(`git count-objects -v failed${detail ? `: ${detail}` : ``}`);
      }
      return result.stdout;
    },
    staleTime: 250,
  });
}

function readRawRootCountObjects(
  root: string,
  host: any,
  dependencies: Pick<RepositorySizeDependencies, `runGit`>,
) {
  if (host == null) throw Error(`host is required for raw Git roots`);
  return runGitChecked(root, [`count-objects`, `-v`], host, dependencies);
}

async function assertRepositorySize(
  repositoryOrRoot: any,
  maximumBytes: number,
  host: any,
  dependencies: RepositorySizeDependencies,
) {
  const output =
    typeof repositoryOrRoot === `string`
      ? await readRawRootCountObjects(repositoryOrRoot, host, dependencies)
      : await readRepositoryCountObjects(repositoryOrRoot, dependencies);
  const values = parseCountObjects(output);
  const bytes = ((values.get(`size`) ?? 0) + (values.get(`size-pack`) ?? 0)) * 1024;
  if (bytes > maximumBytes)
    throw Error(
      `Repository is too large (${formatByteSize(bytes)}). Maximum allowed size is ${formatByteSize(maximumBytes)}.`,
    );
}

export {
  MAX_WORKTREE_SNAPSHOT_REPOSITORY_BYTES,
  assertRepositorySize,
  formatByteSize,
  parseCountObjects,
  readRawRootCountObjects,
  readRepositoryCountObjects,
  runGitChecked,
};
if (typeof module !== `undefined`)
  module.exports = {
    MAX_WORKTREE_SNAPSHOT_REPOSITORY_BYTES,
    assertRepositorySize,
    formatByteSize,
    parseCountObjects,
    readRawRootCountObjects,
    readRepositoryCountObjects,
    runGitChecked,
  };
