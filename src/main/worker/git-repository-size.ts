import {
  MAX_WORKTREE_SNAPSHOT_REPOSITORY_BYTES,
  formatByteSize,
  parseCountObjects,
  repositorySizeBytes,
  repositorySizeError,
} from './git-repository-size-policy';

type RepositorySizeDependencies = {
  getQueryMeta: () => any;
  queryKey: (root: string, host: any, type: string) => any;
  runGit: (root: string, args: string[], host: any) => Promise<any>;
};

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
  const bytes = repositorySizeBytes(output);
  if (bytes > maximumBytes) throw repositorySizeError(bytes, maximumBytes);
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
