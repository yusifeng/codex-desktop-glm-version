type WorktreeListRequestDependencies = {
  getWorktreeRepository: (cwd: unknown, host: unknown) => Promise<any>;
  listWorktrees: (repository: any, signal: AbortSignal) => Promise<any[]>;
};

async function resolveWorktreeList(cwd: unknown, host: unknown, signal: AbortSignal, dependencies: WorktreeListRequestDependencies) {
  const repository = await dependencies.getWorktreeRepository(cwd, host);
  return { worktrees: repository == null ? [] : await dependencies.listWorktrees(repository, signal) };
}

export { resolveWorktreeList };
if (typeof module !== `undefined`) module.exports = { resolveWorktreeList };
