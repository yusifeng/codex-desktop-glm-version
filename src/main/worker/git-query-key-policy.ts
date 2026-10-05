/** Pure cache/query key construction policy for Git worker reads. */
function hostId(host: { id: string }): string { return host.id; }
function gitQueryKey(root: string, host: { id: string }, operation: string, ...parts: string[]): string[] { return [`git`, hostId(host), root, operation, ...parts]; }
function fsmonitorCacheKey(cwd: string, host: { id: string }, env: Record<string, string>): string {
  return JSON.stringify([host.id, cwd, Object.entries(env).filter(([key]) => key !== `GIT_INDEX_FILE`).sort(([a], [b]) => a.localeCompare(b))]);
}
export { fsmonitorCacheKey, gitQueryKey, hostId };
if (typeof module !== `undefined`) module.exports = { fsmonitorCacheKey, gitQueryKey, hostId };
