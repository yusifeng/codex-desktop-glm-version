type GitWatchChangeDependencies = {
  target: any;
  changedPaths: string[];
  pathChanges?: Array<{ path: string }>;
  pathApi: any;
  root: string;
  ignoreSourceWatch?: { target: any; paths: Set<string> };
  changedIgnoreSourcePaths: Set<string>;
  refreshMetadataDirectories: (paths: string[]) => void;
  ignorePolicy?: { requestRefresh: () => void };
  collectHandlerPaths: (handler: any, changedPaths: string[], cache: Map<string, boolean>) => string[];
  handleFileWatchEvent: (changeType: string, paths?: string[]) => void;
  ignoreDirectories?: string[];
  setCurrentHeadRefKnown: (known: boolean) => void;
};

/** Coordinates one parcel watcher event while preserving the repo-watch side effects. */
function handleGitWatchChange(dependencies: GitWatchChangeDependencies): void {
  const {
    target,
    changedPaths,
    pathChanges,
    pathApi,
    root,
    ignoreSourceWatch,
    changedIgnoreSourcePaths,
    refreshMetadataDirectories,
    ignorePolicy,
    collectHandlerPaths,
    handleFileWatchEvent,
    setCurrentHeadRefKnown,
  } = dependencies;
  if (ignoreSourceWatch?.target === target) {
    if (changedPaths.length === 0) changedIgnoreSourcePaths.add(target.watchPath);
    else for (const path of changedPaths) if (ignoreSourceWatch.paths.has(path)) changedIgnoreSourcePaths.add(path);
  }
  const workingTree = target.handlers.some((handler: any) => handler.changeType === `working-tree`);
  if (!workingTree && !target.recursive) refreshMetadataDirectories(changedPaths);
  const ignoreDirectories = dependencies.ignoreDirectories;
  const ignoreDirectoryChanged =
    ignoreDirectories != null &&
    pathChanges?.some(({ path }) => ignoreDirectories.some((directory: string) => pathApi != null && isWithin(pathApi, path, directory)));
  const cache = new Map<string, boolean>();
  target.handlers.forEach((handler: any) => {
    const isWorkingTree = handler.changeType === `working-tree`;
    const paths = collectHandlerPaths(handler, changedPaths, cache);
    if (changedPaths.length > 0 && paths.length === 0) return;
    if (
      handler.changeType === `index` ||
      handler.changeType === `config` ||
      handler.changeType === `head` ||
      (isWorkingTree && (changedPaths.length === 0 || ignoreDirectoryChanged || paths.some((path) => pathApi?.basename(path) === `.gitignore`)))
    ) ignorePolicy?.requestRefresh();
    if (handler.changeType === `head` && (changedPaths.length === 0 || paths.some((path) => pathApi?.basename(path) === `HEAD`))) setCurrentHeadRefKnown(false);
    const rootChanged = isWorkingTree && paths.includes(root);
    handleFileWatchEvent(handler.changeType, changedPaths.length === 0 || rootChanged ? undefined : paths);
  });
}

function isWithin(pathApi: any, value: string, parent: string): boolean {
  if (value === parent) return true;
  const relative = pathApi.relative(parent, value);
  return relative !== `` && relative !== `..` && !relative.startsWith(`..${pathApi.sep}`) && !pathApi.isAbsolute(relative);
}

export { handleGitWatchChange };
if (typeof module !== `undefined`) module.exports = { handleGitWatchChange };
