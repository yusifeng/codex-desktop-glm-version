/** Pure .gitmodules path output parsing policy. */

export function parseSubmodulePathOutput(
  output: string,
  normalizeGitPath: (path: string) => string,
) {
  const paths = output
    .split(`\n`)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => normalizeGitPath(line.split(/\s+/).at(-1) ?? ``))
    .filter((path) => path.length > 0);
  return Array.from(new Set(paths));
}

if (typeof module !== `undefined`) module.exports = { parseSubmodulePathOutput };
