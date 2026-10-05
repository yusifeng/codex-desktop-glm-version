/** Pure classification for core Git worker RPC methods. */
export function isGitCoreRequestMethod(method: string): boolean {
  return method === "availability" || method === "create-branch" || method === "git-origins";
}
if (typeof module !== "undefined") module.exports = { isGitCoreRequestMethod };
