/** Pure validation and normalization policy for local branch creation. */

export function validateLocalBranchName(branch: string) {
  const trimmedBranch = branch.trim();
  const localBranch = trimmedBranch.startsWith(`refs/heads/`)
    ? trimmedBranch.slice(11)
    : trimmedBranch;
  if (!localBranch) return { ok: false, error: `Branch name is required` };
  if (
    localBranch.startsWith(`refs/heads/`) ||
    localBranch.startsWith(`refs/remotes/`) ||
    localBranch.startsWith(`refs/tags/`)
  )
    return { ok: false, error: `Only local branches can be created` };
  return { ok: true, branch: localBranch };
}

if (typeof module !== `undefined`) module.exports = { validateLocalBranchName };
