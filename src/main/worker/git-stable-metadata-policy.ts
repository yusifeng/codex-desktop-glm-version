/** Pure Git-init watcher action policy for stable metadata requests. */

export function resolveStableMetadataWatcherAction(
  hasMetadata: boolean,
  watchForGitInit: boolean | undefined,
) {
  if (!hasMetadata)
    return watchForGitInit === true ? `ensure` : watchForGitInit === false ? `dispose` : `none`;
  return watchForGitInit == null ? `none` : `dispose`;
}

if (typeof module !== `undefined`) module.exports = { resolveStableMetadataWatcherAction };
