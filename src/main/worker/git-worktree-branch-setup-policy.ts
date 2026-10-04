type WorktreeBranchSetupInput = {
  setUpSyncedBranch?: boolean;
  branch: string | null | undefined;
  defaultBranch: string | null | undefined;
  startingState: { type: string; remoteRef?: string | null };
};

/**
 * Decide whether a newly-created worktree needs the local synced-branch config.
 *
 * A branch that is already the repository default, a remote checkout, or an
 * explicitly disabled setup must not get a second tracking configuration.
 */
function shouldSetUpSyncedBranch({
  setUpSyncedBranch = true,
  branch,
  defaultBranch,
  startingState,
}: WorktreeBranchSetupInput) {
  return (
    setUpSyncedBranch &&
    branch != null &&
    branch !== defaultBranch &&
    (startingState.type !== `branch` || startingState.remoteRef == null)
  );
}

export { shouldSetUpSyncedBranch };
if (typeof module !== `undefined`) module.exports = { shouldSetUpSyncedBranch };
