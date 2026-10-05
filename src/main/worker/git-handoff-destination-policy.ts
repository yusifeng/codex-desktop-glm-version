/** Pure destination checkout target policy for handoff. */

export function resolveDestinationCheckoutTarget(
  currentBranch: string | null,
  handoffBranch: string,
  defaultBranch: string | null,
  canDetachDefaultBranch: boolean,
  cleanCommit: string | null,
  sourceHeadSha: string,
) {
  if (currentBranch !== handoffBranch)
    return { checkoutTarget: null, error: null };
  if (defaultBranch != null && defaultBranch !== handoffBranch)
    return { checkoutTarget: defaultBranch, error: null };
  const checkoutTarget = canDetachDefaultBranch && cleanCommit === sourceHeadSha
    ? cleanCommit
    : null;
  return checkoutTarget == null
    ? { checkoutTarget: null, error: `Destination checkout is already using the handoff branch, and Codex could not switch it to a default branch` }
    : { checkoutTarget, error: null };
}

if (typeof module !== `undefined`) module.exports = { resolveDestinationCheckoutTarget };
