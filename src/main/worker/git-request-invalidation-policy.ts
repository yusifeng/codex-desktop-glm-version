/** Pure request classification used by the worker's post-request cache invalidation. */

type Request = { method: string; params?: Record<string, any> };

type InvalidationTarget = { type: `exact`; cwd: string } | { type: `host` };

function resolveMutationRoot(request: Request, normalizeCwd: (value: string) => string, normalizeRoot: (value: string) => string): string | null {
  const params = request.params ?? {};
  for (const key of [`cwd`, `sourceCwd`, `localCwd`, `sourceWorktreeCwd`, `worktreeWorkspaceRoot`]) {
    if (typeof params[key] === `string`) return normalizeCwd(params[key]);
  }
  for (const key of [`root`, `localGitRoot`, `worktreeGitRoot`]) {
    if (typeof params[key] === `string`) return normalizeRoot(params[key]);
  }
  return null;
}

function resolveGitInvalidationTarget(request: Request, normalizeCwd: (value: string) => string, normalizeRoot: (value: string) => string): InvalidationTarget | null {
  const params = request.params ?? {};
  switch (request.method) {
    case `restore-worktree`: return typeof params.worktreePath === `string` ? { type: `exact`, cwd: params.worktreePath } : null;
    case `apply-changes`: return typeof params.destinationRoot === `string` ? { type: `exact`, cwd: normalizeCwd(params.destinationRoot) } : null;
    case `apply-patch`:
    case `apply-review-section-changes`:
    case `checkout-branch`: return typeof params.cwd === `string` ? { type: `exact`, cwd: normalizeCwd(params.cwd) } : null;
    case `commit`: return params.includeUnstaged ? (typeof params.cwd === `string` ? { type: `exact`, cwd: params.cwd } : null) : null;
    case `overwrite-repo`:
    case `git-init-repo`:
    case `delete-worktree`:
    case `move-thread-to-local`:
    case `move-thread-to-worktree`:
    case `move-thread-to-host-worktree`: return { type: `host` };
    case `create-worktree`:
    case `create-branch`: return null;
    default: return null;
  }
}

const mutationMethods = new Set([`push`, `checkout-branch`, `prepare-worktree-snapshot`, `overwrite-repo`, `git-init-repo`, `create-worktree`, `restore-worktree`, `delete-worktree`, `apply-changes`, `apply-patch`, `apply-review-section-changes`, `commit`, `create-branch`, `move-thread-to-local`, `move-thread-to-worktree`, `move-thread-to-host-worktree`]);
function isGitMutationMethod(method: string): boolean { return mutationMethods.has(method); }

export { isGitMutationMethod, resolveGitInvalidationTarget, resolveMutationRoot };
if (typeof module !== `undefined`) module.exports = { isGitMutationMethod, resolveGitInvalidationTarget, resolveMutationRoot };
