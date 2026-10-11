/** Stable host-scoped identity used by Git manager and watcher registries. */
function createGitManagerKey(hostId: string, path: string): string {
  return `${hostId}|${path}`;
}

export { createGitManagerKey };
if (typeof module !== `undefined`) module.exports = { createGitManagerKey };
