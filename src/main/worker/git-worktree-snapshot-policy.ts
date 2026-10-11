function createWorktreeSnapshotRef(worktreeId: string): string { return `codex/worktree-snapshot/${worktreeId}`; }
function createWorktreeSnapshotCommitMessage(snapshotId: string): string { return `Codex worktree snapshot: ${snapshotId}`; }
function parsePushedRemoteBranches(output: string): Record<string, string> {
  const branches: Record<string, string> = {};
  for (const line of output.split(/\r?\n/)) {
    const fields = line.trim().split(/\s+/);
    if (fields.length < 3) continue;
    const [sha, branch, marker] = fields;
    if (marker === `(push)` && branches[sha] == null) branches[sha] = branch;
  }
  return branches;
}
export { createWorktreeSnapshotCommitMessage, createWorktreeSnapshotRef, parsePushedRemoteBranches };
if (typeof module !== `undefined`) module.exports = { createWorktreeSnapshotCommitMessage, createWorktreeSnapshotRef, parsePushedRemoteBranches };
