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

function isCacheableGitCommand(args: string[]): boolean {
  switch (args[0]) {
    case `check-ignore`: case `for-each-ref`: case `merge-base`: case `rev-list`:
    case `rev-parse`: case `show-ref`: case `status`: return true;
    case `cat-file`: return args.includes(`-e`);
    case `ls-files`: return args.includes(`--others`) && !args.includes(`--cached`) && !args.includes(`--ignored`);
    case `config`: return args.some((arg) => [`--get`, `--get-all`, `--get-regexp`, `--list`].includes(arg));
    case `remote`: return args[1] === `get-url`;
    case `worktree`: return args[1] === `list`;
    default: return false;
  }
}

function fsmonitorCacheKey(cwd: string, host: { id: string }, env: Record<string, string>): string {
  return JSON.stringify([host.id, cwd, Object.entries(env).filter(([key]) => key !== `GIT_INDEX_FILE`).sort(([a], [b]) => a.localeCompare(b))]);
}

function parseFsmonitorConfigValue(value: string): boolean | null {
  const normalized = value.toLowerCase();
  if ([`true`, `yes`, `on`].includes(normalized)) return true;
  if ([`false`, `no`, `off`].includes(normalized)) return false;
  return null;
}

function hasFsmonitorDaemonFeature(output: string): boolean {
  return output.split(`\n`).some((line) => line.trim() === `feature: fsmonitor--daemon`);
}

function isFsmonitorPlatformSupported({ isLocal, platformFamily, platformOs }: { isLocal: boolean; platformFamily: string; platformOs: string }): boolean {
  return isLocal ? platformFamily === `windows` || platformOs === `macos` : platformOs === `linux`;
}

export { fsmonitorCacheKey, gitQueryKey, hasFsmonitorDaemonFeature, hostId, isCacheableGitCommand, isFsmonitorPlatformSupported, matchesGitQuery, normalizeGitPath, parseFsmonitorConfigValue, pathsOverlap, utf8ByteLength };
if (typeof module !== `undefined`) module.exports = { fsmonitorCacheKey, gitQueryKey, hasFsmonitorDaemonFeature, hostId, isCacheableGitCommand, isFsmonitorPlatformSupported, matchesGitQuery, normalizeGitPath, parseFsmonitorConfigValue, pathsOverlap, utf8ByteLength };
