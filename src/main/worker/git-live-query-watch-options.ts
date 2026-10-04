type LiveQueryWatch = {
  watcher?: { requiresRecovery?: boolean };
} | null | undefined;

/** Selects whether a live-query consumer may use watcher-backed data. */
function getLiveQueryWatchOptions(watch: LiveQueryWatch): { live: boolean } {
  return { live: watch != null && watch.watcher?.requiresRecovery !== true };
}

export { getLiveQueryWatchOptions };
if (typeof module !== `undefined`) module.exports = { getLiveQueryWatchOptions };
