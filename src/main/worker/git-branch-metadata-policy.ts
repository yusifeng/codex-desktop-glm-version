/** Pure branch metadata reference normalization policy. */

export function normalizeLocalBranchRef(
  branch: string,
  normalizeBranch: (branch: string) => string,
) {
  return normalizeBranch(
    branch.startsWith(`refs/heads/`) ? branch.slice(11) : branch,
  );
}

if (typeof module !== `undefined`) module.exports = { normalizeLocalBranchRef };
