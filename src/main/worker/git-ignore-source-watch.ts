/**
 * Reconciles Git ignore-source watch targets with the latest discovery result.
 *
 * The worker owns the watcher objects and their side effects; this boundary
 * owns the business rules for removing stale sources, updating path sets and
 * restarting sessions when an observed ignore file changed.
 */
async function reconcileGitIgnoreSourceWatches(context: any, discovered: Map<string, Set<string>>) {
  const changedPaths = [...context.changedIgnoreSourcePaths];
  context.changedIgnoreSourcePaths.clear();
  const pending = [];
  let changed = false;

  for (const [sourcePath, registration] of context.ignoreSourceWatches) {
    if (discovered.has(sourcePath) && context.watchTargets.includes(registration.target)) continue;
    changed = true;
    context.ignoreSourceWatches.delete(sourcePath);
    const handlerIndex = registration.target.handlers.indexOf(registration.handler);
    if (handlerIndex >= 0) registration.target.handlers.splice(handlerIndex, 1);
    if (registration.target.handlers.length === 0) {
      const targetIndex = context.watchTargets.indexOf(registration.target);
      if (targetIndex !== -1) context.watchTargets.splice(targetIndex, 1);
      pending.push(context.disposeSession(registration.target));
    }
  }

  for (const [sourcePath, paths] of discovered) {
    const existing = context.ignoreSourceWatches.get(sourcePath);
    if (existing != null) {
      const pathsChanged = existing.paths.size !== paths.size || [...paths].some((path) => !existing.paths.has(path));
      if (pathsChanged) {
        changed = true;
        existing.paths.clear();
        paths.forEach((path) => existing.paths.add(path));
      }
      const pathApi = context.pathApi;
      if (
        pathApi != null &&
        existing.target.retryTimer == null &&
        changedPaths.some((path) => context.isWithinPath(pathApi, path, sourcePath))
      ) {
        changed = true;
        pending.push(context.disposeSession(existing.target).then(() => context.tryStartWatchSession(existing.target, false)));
      }
      continue;
    }

    changed = true;
    const handler = { changeType: "config", shouldHandleChangedPath: (path: string) => paths.has(path) };
    const target = context.addWatchHandler(sourcePath, false, handler, null);
    context.ignoreSourceWatches.set(sourcePath, { target, handler, paths });
    pending.push(context.tryStartWatchSession(target, false));
  }

  await Promise.all(pending);
  return changed;
}

export { reconcileGitIgnoreSourceWatches };
if (typeof module !== "undefined") module.exports = { reconcileGitIgnoreSourceWatches };
