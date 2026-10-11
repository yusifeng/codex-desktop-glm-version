type PosixPathApi = { dirname(path: string): string };

type ParcelChange = { path: string; type: string };

/** Projects parcel changes into emitted paths and root-deletion state. */
function projectParcelWatcherEvents(
  pathApi: PosixPathApi,
  rootPath: string,
  events: ParcelChange[],
  renameEventHandling: string,
): { pathChanges: ParcelChange[]; changedPaths: string[]; rootDeleted: boolean; pathsToCheck: string[] } {
  const pathChanges = events.map(({ path, type }) => ({ path, type }));
  const changedPaths = new Set(pathChanges.map(({ path }) => path));
  if (renameEventHandling === `changed-path-with-parent-directory`) {
    for (const change of pathChanges) {
      if (change.type !== `update`) changedPaths.add(pathApi.dirname(change.path));
    }
  }
  const rootDeleted = pathChanges.some((change) => change.type === `delete` && change.path === rootPath);
  const pathsToCheck = pathChanges
    .filter((change) => change.type === `delete` || (change.type === `update` && change.path !== rootPath))
    .map(({ path }) => path);
  return { pathChanges, changedPaths: [...changedPaths], rootDeleted, pathsToCheck };
}

export { projectParcelWatcherEvents };
if (typeof module !== `undefined`) module.exports = { projectParcelWatcherEvents };
