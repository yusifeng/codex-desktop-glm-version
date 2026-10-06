/** Pure projection of Git ignored paths to agent override files. */
export function filterAgentOverridePaths(output: string, filename = "AGENTS.override.md"): string[] {
  const paths = new Set<string>();
  for (const path of output.split("\0")) if (path === filename || path.endsWith(`/${filename}`)) paths.add(path);
  return [...paths];
}
export function intersectWorktreeIncludePaths(ignoredPaths: string[], includedPaths: string[]): string[] {
  const ignored = new Set(ignoredPaths);
  return [...new Set(includedPaths.filter((path) => ignored.has(path)))];
}
if (typeof module !== "undefined") module.exports = { filterAgentOverridePaths, intersectWorktreeIncludePaths };
