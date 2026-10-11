/** Stable host-scoped identity used by Git manager and watcher registries. */
function createGitManagerKey(hostId: string, path: string): string {
  return `${hostId}|${path}`;
}
function isGitManagerKeyForHost(key: string, hostId: string): boolean {
  return key.startsWith(`${hostId}|`);
}
function createGitManagerGenerationKey(hostId: string, path: string, generation: number): string {
  return `${createGitManagerKey(hostId, path)}|${generation}`;
}

export { createGitManagerGenerationKey, createGitManagerKey, isGitManagerKeyForHost };
if (typeof module !== `undefined`) module.exports = { createGitManagerGenerationKey, createGitManagerKey, isGitManagerKeyForHost };
