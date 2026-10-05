/** Pure classification for worktree snapshot read RPC methods. */
export function isWorktreeSnapshotReadMethod(method: string): boolean {
  return method === "worktree-snapshot-ref" || method === "managed-worktree-state";
}
if (typeof module !== "undefined") module.exports = { isWorktreeSnapshotReadMethod };
