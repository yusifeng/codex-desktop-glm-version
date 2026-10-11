/** Stable host-scoped identity used by Git manager and watcher registries. */
function createGitManagerKey(hostId: string, path: string): string {
  return `${hostId}|${path}`;
}
function isGitManagerKeyForHost(key: string, hostId: string): boolean {
  return key.startsWith(`${hostId}|`);
}

export { createGitManagerKey, isGitManagerKeyForHost };
if (typeof module !== `undefined`) module.exports = { createGitManagerKey, isGitManagerKeyForHost };
