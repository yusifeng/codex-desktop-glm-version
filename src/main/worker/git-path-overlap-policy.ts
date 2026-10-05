/** Pure path normalization and overlap policy for Git watcher invalidation. */
function normalizeGitPath(value: string): string { return value.replaceAll(`\\`, `/`).replace(/\/+$/, ``); }
function pathsOverlap(root: string, watchedPaths: unknown, changedPaths: unknown): boolean {
  if (!Array.isArray(watchedPaths) || changedPaths == null) return true;
  const normalizedRoot = normalizeGitPath(root);
  return (changedPaths as unknown[]).some((changed) => {
    const normalizedChanged = normalizeGitPath(String(changed));
    const relative = normalizedChanged.startsWith(`${normalizedRoot}/`) ? normalizedChanged.slice(normalizedRoot.length + 1) : normalizedChanged;
    return (watchedPaths as unknown[]).some((watched) => typeof watched === `string` && (relative === watched || relative.startsWith(`${watched}/`) || watched.startsWith(`${relative}/`)));
  });
}
export { normalizeGitPath, pathsOverlap };
if (typeof module !== `undefined`) module.exports = { normalizeGitPath, pathsOverlap };
