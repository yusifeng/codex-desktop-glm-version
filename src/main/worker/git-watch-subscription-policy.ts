/** Selects the stable subscription state after repository metadata and watch state are ready. */
export function selectGitWatchSubscriptionState(options: {
  metadata: { commonDir: string; root: string };
  watch: { watcher?: { requiresRecovery?: boolean } } | null | undefined;
}) {
  return {
    commonDir: options.metadata.commonDir,
    root: options.metadata.root,
    requiresRecovery: options.watch?.watcher?.requiresRecovery ?? true,
  };
}

if (typeof module !== "undefined") module.exports = { selectGitWatchSubscriptionState };
