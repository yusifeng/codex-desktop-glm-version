type MergeBaseDependencies = {
  getConfigQueryMeta: () => any;
  getQueryMeta: () => any;
  getOrderedRemotes: (repository: any) => Promise<string[]>;
  queryKey: (...parts: any[]) => any;
  resolveRef: (repository: any, ref: string) => Promise<string | null>;
  runGit: (root: string, args: string[], host: any, options?: any) => Promise<any>;
  staleTime: number;
};

function queryBranchUpstream(
  repository: any,
  branch: string,
  dependencies: MergeBaseDependencies,
) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(
      repository.root,
      repository.host,
      `branch-upstream`,
      branch,
    ),
    meta: dependencies.getConfigQueryMeta(),
    queryFn: async () => {
      const result = await dependencies.runGit(
        repository.root,
        [`for-each-ref`, `--format=%(upstream:short)`, `refs/heads/${branch}`],
        repository.host,
      );
      return result.success && result.stdout ? result.stdout.trim() : null;
    },
    staleTime: dependencies.staleTime,
  });
}

function queryHeadMergeBase(
  repository: any,
  ref: string,
  dependencies: MergeBaseDependencies,
) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(
      repository.root,
      repository.host,
      `head-merge-base`,
      ref,
    ),
    meta: dependencies.getQueryMeta(),
    queryFn: async () => {
      const result = await dependencies.runGit(
        repository.root,
        [`merge-base`, `HEAD`, ref],
        repository.host,
        { allowedNonZeroExitCodes: [1, 128] },
      );
      if (result.code === 128)
        return { mergeBase: null, requiresRefCheck: true };
      if (!result.success || !result.stdout)
        return { mergeBase: null, requiresRefCheck: false };
      const mergeBase = result.stdout.trim();
      return {
        mergeBase: mergeBase.length > 0 ? mergeBase : null,
        requiresRefCheck: false,
      };
    },
    staleTime: dependencies.staleTime,
  });
}

async function resolveMergeBaseDirect(
  repository: any,
  ref: string,
  dependencies: MergeBaseDependencies,
) {
  const result = await dependencies.runGit(
    repository.root,
    [`merge-base`, `HEAD`, ref],
    repository.host,
    { allowedNonZeroExitCodes: [1] },
  );
  if (!result.success) throw Error(`Git merge-base failed`);
  return result.stdout.trim() || null;
}

async function resolveMergeBase(
  repository: any,
  baseBranch: string,
  dependencies: MergeBaseDependencies,
) {
  const branch = baseBranch.trim();
  if (!branch) return null;
  const initial = await queryHeadMergeBase(repository, branch, dependencies);
  if (!initial.requiresRefCheck) return initial.mergeBase;
  const [head, requestedRef] = await Promise.all([
    dependencies.resolveRef(repository, `HEAD`),
    dependencies.resolveRef(repository, branch),
  ]);
  if (head == null) return null;
  if (requestedRef != null)
    return resolveMergeBaseDirect(repository, branch, dependencies);
  const [upstream, remotes] = await Promise.all([
    queryBranchUpstream(repository, branch, dependencies),
    dependencies.getOrderedRemotes(repository),
  ]);
  const [first, ...rest] = buildMergeBaseCandidates(branch, remotes, upstream);
  let resolved =
    first != null && (await dependencies.resolveRef(repository, first))
      ? first
      : null;
  if (resolved == null) {
    const results = await Promise.all(
      rest.map((candidate) => dependencies.resolveRef(repository, candidate)),
    );
    const index = results.findIndex((value) => value != null);
    resolved = index === -1 ? null : rest[index];
  }
  if (resolved == null) return null;
  const fallback = await queryHeadMergeBase(repository, resolved, dependencies);
  return fallback.requiresRefCheck
    ? resolveMergeBaseDirect(repository, resolved, dependencies)
    : fallback.mergeBase;
}

export {
  buildMergeBaseCandidates,
  queryBranchUpstream,
  queryHeadMergeBase,
  resolveMergeBase,
  resolveMergeBaseDirect,
};
if (typeof module !== `undefined`)
  module.exports = {
    buildMergeBaseCandidates,
    queryBranchUpstream,
    queryHeadMergeBase,
    resolveMergeBase,
    resolveMergeBaseDirect,
  };
import { buildMergeBaseCandidates } from "./git-merge-base-policy";
