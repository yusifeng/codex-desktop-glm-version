/** Pure query-key matching policy for host-scoped Git cache invalidation. */
function matchesGitQuery(queryKey: unknown, host?: { id: string } | null): boolean {
  return Array.isArray(queryKey) && queryKey[0] === `git` && (host == null || queryKey[1] === host.id);
}
export { matchesGitQuery };
if (typeof module !== `undefined`) module.exports = { matchesGitQuery };
