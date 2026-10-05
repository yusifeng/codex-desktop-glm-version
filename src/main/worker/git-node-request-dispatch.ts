type NodeRequestDispatchDependencies = {
  host: any;
  signal: AbortSignal;
  requestGitHub?: (params: any, signal: AbortSignal) => Promise<unknown>;
  resolveAutomationWritableRoots?: (params: any) => Promise<string[]>;
  readGitFileBinary?: (params: any, host: any, signal: AbortSignal) => Promise<unknown>;
  getWorktreeRepository?: (cwd: string, host: any) => Promise<any>;
  prepareWorktreeSnapshot?: (repository: any, snapshotBranch: string) => Promise<unknown>;
};

async function dispatchGitNodeRequest(
  method: string,
  params: any,
  deps: NodeRequestDispatchDependencies,
) {
  if (!isGitNodeRequestMethod(method)) return { handled: false, result: undefined };
  switch (method) {
    case `github-request`:
      if (deps.requestGitHub == null)
        throw Error(`GitHub requests require a Node Git worker`);
      return { handled: true, result: await deps.requestGitHub(params, deps.signal) };
    case `automation-writable-roots`:
      if (deps.resolveAutomationWritableRoots == null)
        throw Error(`Resolving automation writable roots requires a Node Git worker`);
      return {
        handled: true,
        result: { roots: await deps.resolveAutomationWritableRoots(params) },
      };
    case `read-git-file-binary`:
      if (deps.readGitFileBinary == null)
        throw Error(`Reading Git binary files requires a Node Git worker`);
      return {
        handled: true,
        result: await deps.readGitFileBinary(params, deps.host, deps.signal),
      };
    case `prepare-worktree-snapshot`: {
      if (deps.prepareWorktreeSnapshot == null)
        throw Error(`Preparing worktree snapshots requires a Node Git worker`);
      if (deps.getWorktreeRepository == null)
        throw Error(`Preparing worktree snapshots requires a Node Git worker`);
      const repository = await deps.getWorktreeRepository(params.cwd, deps.host);
      if (repository == null) throw Error(`gitRoot must belong to a Git worktree`);
      return {
        handled: true,
        result: await deps.prepareWorktreeSnapshot(repository, params.snapshotBranch),
      };
    }
    default:
      return { handled: false, result: undefined };
  }
}

export { dispatchGitNodeRequest };
if (typeof module !== `undefined`)
  module.exports = { dispatchGitNodeRequest };
import { isGitNodeRequestMethod } from "./git-node-request-policy";
