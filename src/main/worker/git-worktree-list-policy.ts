export function parseWorktreeList(
  output: string,
  normalizeRoot: (root: string) => string,
) {
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

if (typeof module !== `undefined`) module.exports = { parseWorktreeList };
