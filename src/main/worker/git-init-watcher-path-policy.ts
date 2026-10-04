/** Return whether a workspace watcher event may indicate `.git` changed. */
function shouldCheckGitInitPath(changedPaths: unknown, gitDirectoryPath: string, pathSeparator: string): boolean {
  if (!Array.isArray(changedPaths) || changedPaths.length === 0) return true;
  return changedPaths.some((changedPath) =>
    typeof changedPath === `string` &&
    (changedPath === gitDirectoryPath || changedPath.startsWith(`${gitDirectoryPath}${pathSeparator}`)),
  );
}

export { shouldCheckGitInitPath };
if (typeof module !== `undefined`) module.exports = { shouldCheckGitInitPath };
