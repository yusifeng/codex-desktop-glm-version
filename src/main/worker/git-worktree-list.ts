const WORKTREE_LIST_CACHE_MS = 250;

type WorktreeListDependencies = {
  getQueryMeta: () => any;
  normalizeRoot: (root: string) => string;
  queryKey: (...parts: any[]) => any;
  runGit: (root: string, args: string[], host: any, options: any) => Promise<any>;
};

function parseWorktreeList(output: string, normalizeRoot: (root: string) => string) {
  const worktrees: any[] = [];
  let current: any = null;
  for (const line of output.split(/\r?\n/)) {
    const value = line.trim();
    if (value.length === 0) {
      if (current) {
        worktrees.push(current);
        current = null;
      }
      continue;
    }
    if (value.startsWith(`worktree `)) {
      if (current) worktrees.push(current);
      const root = normalizeRoot(value.slice(9).trim());
      if (!root) {
        current = null;
        continue;
      }
      current = {
        root,
        prunable: false,
        locked: false,
        headRef: { sha: ``, type: `detached` },
      };
      continue;
    }
    if (!current) continue;
    if (value.startsWith(`HEAD `)) {
      current.headRef = { sha: value.slice(5).trim(), type: `detached` };
      continue;
    }
    if (value.startsWith(`branch `)) {
      const branch = value.slice(7).trim();
      current.headRef = {
        sha: current.headRef.sha,
        type: `branch`,
        string: branch.startsWith(`refs/heads/`) ? branch.slice(11) : branch,
      };
      continue;
    }
    if (value === `detached`) {
      current.headRef = { sha: current.headRef.sha, type: `detached` };
      continue;
    }
    if (value.startsWith(`prunable`)) {
      current.prunable = true;
      continue;
    }
    if (value.startsWith(`locked`)) current.locked = true;
  }
  if (current) worktrees.push(current);
  return worktrees;
}

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
