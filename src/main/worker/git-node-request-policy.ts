/** Pure classification for Node-only Git worker RPC methods. */
export function isGitNodeRequestMethod(method: string): boolean {
  return method === "github-request" || method === "automation-writable-roots" || method === "read-git-file-binary" || method === "prepare-worktree-snapshot";
}
if (typeof module !== "undefined") module.exports = { isGitNodeRequestMethod };
