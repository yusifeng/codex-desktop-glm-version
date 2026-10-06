/** Pure NUL-separated Git path projection; filesystem copy remains in git-worktree-copy-files.ts. */
export function splitGitWorktreeNullSeparatedPaths(output: string): string[] {
  return output.split("\0").filter((path) => path.length > 0);
}
if (typeof module !== "undefined") module.exports = { splitGitWorktreeNullSeparatedPaths };
