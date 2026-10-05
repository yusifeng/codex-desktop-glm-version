export async function dispatchWorktreeSnapshotRead(method: string, params: any, deps: any): Promise<unknown> {
  if (!isWorktreeSnapshotReadMethod(method)) return undefined;
  switch (method) {
    case `worktree-snapshot-ref`: return deps.snapshotRef(params.candidateRoots, params.worktreePath);
    case `managed-worktree-state`: return deps.managedState(params.candidateRoots, params.cwd, params.worktreePath);
    default: return undefined;
  }
}
if (typeof module !== `undefined`) module.exports = { dispatchWorktreeSnapshotRead };
import { isWorktreeSnapshotReadMethod } from "./git-worktree-snapshot-read-policy";
