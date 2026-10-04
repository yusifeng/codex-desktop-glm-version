export async function dispatchReadOnlyGitRequest(method: string, params: any, deps: any): Promise<unknown> {
  switch (method) {
    case `origin-url`: return deps.resolveOriginUrl(params.cwd);
    case `origin-and-roots`: return deps.resolveOrigins(params.discoveryDirs);
    case `worktree-shell-environment`: return deps.resolveShellEnvironment(params.cwd, deps.signal);
    case `worktree-owner`: return deps.resolveWorktreeOwner(params.cwd);
    case `default-remote-branch`: return deps.resolveDefaultRemoteBranch(params.cwd);
    case `merge-base`: return deps.resolveMergeBase(params.cwd, params.baseBranch);
    default: return undefined;
  }
}
if (typeof module !== `undefined`) module.exports = { dispatchReadOnlyGitRequest };
