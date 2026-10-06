const WORKTREE_LIST_CACHE_MS = 250;
import { parseWorktreeList } from "./git-worktree-list-policy";

type WorktreeListDependencies = {
  getQueryMeta: () => any;
  normalizeRoot: (root: string) => string;
  queryKey: (...parts: any[]) => any;
  runGit: (root: string, args: string[], host: any, options: any) => Promise<any>;
};

function listGitWorktrees(
  repository: any,
  signal: AbortSignal,
  dependencies: WorktreeListDependencies,
) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(repository.root, repository.host, `worktrees`),
    gcTime: WORKTREE_LIST_CACHE_MS,
    meta: dependencies.getQueryMeta(),
    queryFn: async () => {
      const result = await dependencies.runGit(
        repository.root,
        [`worktree`, `list`, `--porcelain`],
        repository.host,
        { signal },
      );
      if (!result.success)
        throw Error(result.stderr || result.stdout || `Failed to list worktrees for repository`);
      return parseWorktreeList(result.stdout ?? ``, dependencies.normalizeRoot);
    },
    staleTime: WORKTREE_LIST_CACHE_MS,
  });
}

export { listGitWorktrees, parseWorktreeList };
if (typeof module !== `undefined`) module.exports = { listGitWorktrees, parseWorktreeList };
