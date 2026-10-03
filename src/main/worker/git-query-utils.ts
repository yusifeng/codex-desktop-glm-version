const encoder = new TextEncoder();

function hostId(host: { id: string }): string {
  return host.id;
}

function gitQueryKey(root: string, host: { id: string }, operation: string, ...parts: string[]): string[] {
  return [`git`, hostId(host), root, operation, ...parts];
}

function normalizeGitPath(value: string): string {
  return value.replaceAll(`\\`, `/`).replace(/\/+$/, ``);
}

function utf8ByteLength(value: string): number {
  return encoder.encode(value).byteLength;
}

function matchesGitQuery(queryKey: unknown, host?: { id: string } | null): boolean {
  return Array.isArray(queryKey) && queryKey[0] === `git` && (host == null || queryKey[1] === hostId(host));
}

function pathsOverlap(root: string, watchedPaths: unknown, changedPaths: unknown): boolean {
  if (!Array.isArray(watchedPaths) || changedPaths == null) return true;
  const normalizedRoot = normalizeGitPath(root);
  return (changedPaths as unknown[]).some((changed) => {
    const normalizedChanged = normalizeGitPath(String(changed));
    const relative = normalizedChanged.startsWith(`${normalizedRoot}/`)
      ? normalizedChanged.slice(normalizedRoot.length + 1)
      : normalizedChanged;
    return (watchedPaths as unknown[]).some((watched) =>
      typeof watched === `string` &&
      (relative === watched || relative.startsWith(`${watched}/`) || watched.startsWith(`${relative}/`)),
    );
  });
}

export { gitQueryKey, hostId, matchesGitQuery, normalizeGitPath, pathsOverlap, utf8ByteLength };
if (typeof module !== `undefined`) module.exports = { gitQueryKey, hostId, matchesGitQuery, normalizeGitPath, pathsOverlap, utf8ByteLength };
