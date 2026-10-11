type GitWorktreeDeleteLifecycleDependencies = {
  worktree: any;
  host: any;
  reason: string;
  force: boolean;
  getWorktreeId: (worktree: any) => Promise<string>;
  logInfo: (message: string, details: any) => void;
  logWarning: (message: string, details: any) => void;
  deleteWithSnapshot: (worktree: any, host: any, reason: string, force: boolean) => Promise<void>;
};

/** Coordinates worktree identity, snapshot/delete operation, and lifecycle logging. */
async function deleteGitWorktreeLifecycle(dependencies: GitWorktreeDeleteLifecycleDependencies): Promise<string> {
  const { worktree, host, reason, force, getWorktreeId, logInfo, logWarning, deleteWithSnapshot } = dependencies;
  const worktreeId = await getWorktreeId(worktree);
  logInfo(`[worktree-delete] worker-start`, { safe: { worktreeId }, sensitive: { reason, force, hasHostConfig: host != null } });
  try {
    await deleteWithSnapshot(worktree, host, reason, force);
  } catch (error) {
    logWarning(`[worktree-delete] worker-failed`, { safe: { worktreeId }, sensitive: { error } });
    throw error;
  }
  logInfo(`[worktree-delete] worker-success`, { safe: { worktreeId }, sensitive: { reason, force } });
  return worktreeId;
}

export { deleteGitWorktreeLifecycle };
if (typeof module !== `undefined`) module.exports = { deleteGitWorktreeLifecycle };
